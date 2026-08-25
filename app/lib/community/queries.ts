import { cache } from "react";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";
import { POSTS_PER_PAGE } from "./constants";
import { clockOf, MONTHS_SHORT, calendarDayOf } from "../care/time";



const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || "?";


const AVATAR_COLOURS = ["#56785d", "#8a76bd", "#c08b5e", "#4f8a8b", "#a4676b", "#6f7f9e"];
function colourFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLOURS[hash % AVATAR_COLOURS.length];
}

export type CommunityPerson = {
  id: string;
  name: string;

  role: string;
  initial: string;
  color: string;

  verified: boolean;

  avatarUrl: string | null;
};

function personOf(row: {
  id: string;
  full_name: string | null;
  headline: string | null;
  verified: boolean | null;
  role?: string | null;
  avatar_url?: string | null;
}): CommunityPerson {
  const name = row.full_name?.trim() || "Pengguna Karsa";
  return {
    id: row.id,
    name,
    role: row.headline?.trim() || (row.role === "patient" ? "Pasien" : "Pendamping"),
    initial: initialOf(name),
    color: colourFor(row.id),
    verified: Boolean(row.verified),
    avatarUrl: row.avatar_url ?? null,
  };
}


function ageLabel(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari yang lalu`;
  const day = calendarDayOf(iso);
  return `${day.d} ${MONTHS_SHORT[day.m]}`;
}

export type CommunityPost = {
  id: string;
  author: CommunityPerson;
  title: string;
  snippet: string;
  body: string;
  age: string;
  replies: number;
  upvotes: number;

  voted: boolean;
  keywords: string[];
  tags: string[];
  groupId: string | null;

  imageUrl: string | null;
};

export type CommunityGroup = {
  id: string;
  name: string;
  blurb: string;
  members: number;
  keywords: string[];
  art: string;
  tone: string;
  joined: boolean;
  createdBy: string | null;
  isAdmin: boolean;
};

export type CommunitySession = {
  id: string;
  title: string;
  blurb: string;
  host: string;

  date: string;
  time: string;
  joined: boolean;
};

export type CommunityTopic = { label: string; term: string; threads: number };


async function peopleFor(ids: (string | null)[]): Promise<Map<string, CommunityPerson>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, headline, verified, role, avatar_url")
    .in("id", unique);

  return new Map((data ?? []).map((row) => [row.id as string, personOf(row)]));
}


export { POSTS_PER_PAGE };

export const getCommunityPosts = cache(
  async (limit = POSTS_PER_PAGE, offset = 0): Promise<CommunityPost[]> => {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const me = await getSessionProfile();

  const [{ data, error }, { data: myVotes }] = await Promise.all([
    supabase
      .from("community_feed")
      .select("id, author_id, group_id, title, body, image_url, keywords, tags, created_at, replies, upvotes")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
    me
      ? supabase.from("community_votes").select("post_id").eq("profile_id", me.id)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  if (error || !data) return [];

  const voted = new Set((myVotes ?? []).map((v) => v.post_id as string));
  const people = await peopleFor(data.map((r) => r.author_id as string));

  return data.map((row) => {
    const body = (row.body as string) ?? "";
    return {
      id: row.id as string,
      author:
        people.get(row.author_id as string) ??
        personOf({ id: row.author_id as string, full_name: null, headline: null, verified: false }),
      title: row.title as string,

      snippet: body.length > 240 ? `${body.slice(0, 240).trimEnd()}…` : body,
      body,
      age: ageLabel(row.created_at as string),
      replies: Number(row.replies ?? 0),
      upvotes: Number(row.upvotes ?? 0),
      voted: voted.has(row.id as string),
      keywords: (row.keywords as string[]) ?? [],
      tags: (row.tags as string[]) ?? [],
      groupId: (row.group_id as string | null) ?? null,
      imageUrl: (row.image_url as string | null) ?? null,
    };
  });
  },
);

export const getCommunityGroups = cache(async (): Promise<CommunityGroup[]> => {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const me = await getSessionProfile();

  const [{ data, error }, { data: members }, { data: mine }] = await Promise.all([
    supabase
      .from("community_groups")
      .select("id, name, blurb, art, tone, keywords, created_by")
      .order("created_at", { ascending: true }),

    supabase.from("community_group_members").select("group_id"),
    me
      ? supabase.from("community_group_members").select("group_id").eq("profile_id", me.id)
      : Promise.resolve({ data: [] as { group_id: string }[] }),
  ]);

  if (error || !data) return [];

  const tally = new Map<string, number>();
  for (const row of members ?? []) {
    const id = row.group_id as string;
    tally.set(id, (tally.get(id) ?? 0) + 1);
  }
  const joined = new Set((mine ?? []).map((r) => r.group_id as string));

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    blurb: (row.blurb as string) ?? "",
    members: tally.get(row.id as string) ?? 0,
    keywords: (row.keywords as string[]) ?? [],
    art: (row.art as string) ?? "heart",
    tone: (row.tone as string) ?? "karsa",
    joined: joined.has(row.id as string),
    createdBy: (row.created_by as string | null) ?? null,
    isAdmin: Boolean(me && row.created_by === me.id),
  }));
});


export const getNextSession = cache(async (): Promise<CommunitySession | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const me = await getSessionProfile();

  const { data } = await supabase
    .from("community_sessions")
    .select("id, title, blurb, host_name, starts_at")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  let joined = false;
  if (me) {
    const { data: signup } = await supabase
      .from("community_session_signups")
      .select("session_id")
      .eq("session_id", data.id)
      .eq("profile_id", me.id)
      .maybeSingle();
    joined = Boolean(signup);
  }

  const starts = data.starts_at as string;
  const day = calendarDayOf(starts);
  const weekday = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][
    new Date(day.y, day.m, day.d).getDay()
  ];

  return {
    id: data.id as string,
    title: data.title as string,
    blurb: (data.blurb as string) ?? "",
    host: (data.host_name as string) ?? "",
    date: `${weekday}, ${day.d} ${MONTHS_SHORT[day.m]}`,

    time: `${clockOf(starts).replace(":", ".")} WIB`,
    joined,
  };
});


export const getCommunityTopics = cache(async (limit = 9): Promise<CommunityTopic[]> => {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("community_posts")
    .select("keywords, tags")
    .order("created_at", { ascending: false })
    .limit(200);

  const tally = new Map<string, number>();
  for (const row of data ?? []) {
    const words = [...((row.keywords as string[]) ?? []), ...((row.tags as string[]) ?? [])];

    for (const word of new Set(words.map((w) => w.trim()).filter(Boolean))) {
      tally.set(word, (tally.get(word) ?? 0) + 1);
    }
  }

  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, threads]) => ({
      term,

      label: `#${term.replace(/\s+(.)/g, (_, c: string) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase())}`,
      threads,
    }));
});


export const getSuggestedPeople = cache(async (limit = 4): Promise<CommunityPerson[]> => {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const me = await getSessionProfile();

  const [{ data: profiles }, { data: following }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, headline, verified, role, avatar_url")
      .order("verified", { ascending: false })
      .limit(40),
    me
      ? supabase.from("community_follows").select("followee_id").eq("follower_id", me.id)
      : Promise.resolve({ data: [] as { followee_id: string }[] }),
  ]);

  const followed = new Set((following ?? []).map((r) => r.followee_id as string));

  return (profiles ?? [])
    .filter((row) => row.id !== me?.id && !followed.has(row.id as string))
    .filter((row) => (row.full_name as string | null)?.trim())
    .slice(0, limit)
    .map(personOf);
});

export type GroupMessage = {
  id: string;
  authorId: string;
  author: string;
  initial: string;
  color: string;
  body: string;
  when: string;
};

export const getMyGroups = cache(async (): Promise<CommunityGroup[]> => {
  const all = await getCommunityGroups();
  return all.filter((g) => g.joined);
});

export const getGroupMessages = cache(
  async (groupId: string, limit = 100): Promise<GroupMessage[]> => {
    if (!isSupabaseConfigured() || !groupId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("community_group_messages")
      .select("id, author_id, body, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    const people = await peopleFor(data.map((r) => r.author_id as string));

    return data
      .map((row) => {
        const person = people.get(row.author_id as string);
        const name = person?.name ?? "Pengguna Karsa";
        return {
          id: row.id as string,
          authorId: row.author_id as string,
          author: name,
          initial: person?.initial ?? initialOf(name),
          color: person?.color ?? colourFor(row.author_id as string),
          body: row.body as string,
          when: ageLabel(row.created_at as string),
        };
      })
      .reverse();
  },
);

export type PostComment = {
  id: string;
  authorId: string;
  author: string;
  initial: string;
  color: string;
  role: string;
  verified: boolean;
  body: string;
  when: string;
};

export const getPostComments = cache(async (postId: string): Promise<PostComment[]> => {
  if (!isSupabaseConfigured() || !postId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_comments")
    .select("id, author_id, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const people = await peopleFor(data.map((r) => r.author_id as string));

  return data.map((row) => {
    const id = row.author_id as string;
    const person = people.get(id);
    const name = person?.name ?? "Pengguna Karsa";
    return {
      id: row.id as string,
      authorId: id,
      author: name,
      initial: person?.initial ?? initialOf(name),
      color: person?.color ?? colourFor(id),
      role: person?.role ?? "Pendamping",
      verified: person?.verified ?? false,
      body: row.body as string,
      when: ageLabel(row.created_at as string),
    };
  });
});

export type GroupMember = {
  id: string;
  name: string;
  initial: string;
  color: string;
  role: string;
  isAdmin: boolean;
};

export const getGroupMembers = cache(async (groupId: string): Promise<GroupMember[]> => {
  if (!isSupabaseConfigured() || !groupId) return [];

  const supabase = await createClient();
  const [{ data: rows }, { data: group }] = await Promise.all([
    supabase
      .from("community_group_members")
      .select("profile_id, joined_at")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true }),
    supabase.from("community_groups").select("created_by").eq("id", groupId).maybeSingle(),
  ]);

  const owner = (group?.created_by as string | null) ?? null;
  const people = await peopleFor((rows ?? []).map((r) => r.profile_id as string));

  return (rows ?? []).map((row) => {
    const id = row.profile_id as string;
    const person = people.get(id);
    const name = person?.name ?? "Pengguna Karsa";
    return {
      id,
      name,
      initial: person?.initial ?? initialOf(name),
      color: person?.color ?? colourFor(id),
      role: person?.role ?? "Pendamping",
      isAdmin: id === owner,
    };
  });
});

export type AccountStats = { followers: number; following: number; team: number };

export const getAccountStats = cache(async (): Promise<AccountStats> => {
  const blank = { followers: 0, following: 0, team: 0 };
  if (!isSupabaseConfigured()) return blank;

  const me = await getSessionProfile();
  if (!me) return blank;

  const supabase = await createClient();
  const [followers, following, asCaregiver, myPatient] = await Promise.all([
    supabase
      .from("community_follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("followee_id", me.id),
    supabase
      .from("community_follows")
      .select("followee_id", { count: "exact", head: true })
      .eq("follower_id", me.id),
    supabase
      .from("care_relationships")
      .select("id", { count: "exact", head: true })
      .eq("caregiver_id", me.id)
      .in("status", ["pending", "active"]),
    supabase.from("patients").select("id").eq("user_id", me.id).maybeSingle(),
  ]);

  let team = asCaregiver.count ?? 0;

  if (myPatient.data?.id) {
    const { count } = await supabase
      .from("care_relationships")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", myPatient.data.id)
      .in("status", ["pending", "active"]);
    team += count ?? 0;
  }

  return {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    team,
  };
});

export const getMyGroupCount = cache(async (): Promise<number> => {
  if (!isSupabaseConfigured()) return 0;
  const me = await getSessionProfile();
  if (!me) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("community_groups")
    .select("id", { count: "exact", head: true })
    .eq("created_by", me.id);

  return count ?? 0;
});


export async function getCommunityData() {
  const [posts, groups, topics, people, me, followedIds] = await Promise.all([
    getCommunityPosts(),
    getCommunityGroups(),
    getCommunityTopics(),
    getSuggestedPeople(),
    getSessionProfile(),
    getFollowedIds(),
  ]);
  return {
    posts,
    groups,
    topics,
    people,
    myGroups: groups.filter((g) => g.joined),
    meId: me?.id ?? null,
    ownsGroup: groups.some((g) => g.isAdmin),

    followedIds,
  };
}

export type CommunityData = Awaited<ReturnType<typeof getCommunityData>>;




export const getFollowedIds = cache(async (): Promise<string[]> => {
  if (!isSupabaseConfigured()) return [];
  const me = await getSessionProfile();
  if (!me) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("community_follows")
    .select("followee_id")
    .eq("follower_id", me.id);

  return (data ?? []).map((r) => r.followee_id as string);
});


export async function searchPeople(query: string, limit = 12): Promise<CommunityPerson[]> {
  const term = query.trim();
  if (!isSupabaseConfigured() || term.length < 2) return [];

  const supabase = await createClient();
  const me = await getSessionProfile();
  const escaped = term.replace(/[%_\\]/g, (c) => `\\${c}`);

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, headline, verified, role, avatar_url")
    .ilike("full_name", `%${escaped}%`)
    .order("verified", { ascending: false })
    .limit(limit + 1);

  return (data ?? [])
    .filter((row) => row.id !== me?.id)
    .filter((row) => (row.full_name as string | null)?.trim())
    .slice(0, limit)
    .map(personOf);
}


export type ProfileCard = CommunityPerson & {

  bio: string | null;

  isCaregiver: boolean;
  followers: number;
  following: number;

  team: number;

  followed: boolean;
};

export async function getProfileCard(profileId: string): Promise<ProfileCard | null> {
  if (!isSupabaseConfigured() || !profileId) return null;

  const supabase = await createClient();
  const me = await getSessionProfile();

  const { data: row } = await supabase
    .from("profiles")
    .select("id, full_name, headline, verified, role, avatar_url")
    .eq("id", profileId)
    .maybeSingle();

  if (!row) return null;

  const [followers, following, asCaregiver, theirPatient, mine] = await Promise.all([
    supabase
      .from("community_follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("followee_id", profileId),
    supabase
      .from("community_follows")
      .select("followee_id", { count: "exact", head: true })
      .eq("follower_id", profileId),
    supabase
      .from("care_relationships")
      .select("id", { count: "exact", head: true })
      .eq("caregiver_id", profileId)
      .in("status", ["pending", "active"]),
    supabase.from("patients").select("id").eq("user_id", profileId).maybeSingle(),
    me
      ? supabase
          .from("community_follows")
          .select("followee_id")
          .eq("follower_id", me.id)
          .eq("followee_id", profileId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let team = asCaregiver.count ?? 0;


  if (theirPatient.data?.id) {
    const { count } = await supabase
      .from("care_relationships")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", theirPatient.data.id)
      .in("status", ["pending", "active"]);
    team += count ?? 0;
  }

  const person = personOf(row);

  return {
    ...person,
    bio: (row.headline as string | null)?.trim() || null,
    isCaregiver: row.role !== "patient",
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    team,
    followed: Boolean(mine.data),
  };
}
