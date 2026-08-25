"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, UserMinus, UsersRound } from "lucide-react";
import Modal from "./Modal";
import HealthPattern from "./HealthPattern";
import TypingDots from "./TypingDots";
import { useGroupChannel } from "./useGroupChannel";
import {
  kickMember,
  loadGroupMembers,
  loadGroupMessages,
  sendGroupMessage,
  type CommunityResult,
} from "../lib/community/actions";
import type { CommunityGroup, GroupMember, GroupMessage } from "../lib/community/queries";

const WALLPAPER = "#f1ede3";

export default function GroupChat({
  group,
  meId,
  onClose,
}: {
  group: CommunityGroup | null;
  meId: string | null;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const streamRef = useRef<HTMLDivElement>(null);

  const [state, send, sending] = useActionState<CommunityResult, FormData>(
    sendGroupMessage,
    { error: null },
  );

  useEffect(() => {
    if (!group) {
      setMessages([]);
      setMembers([]);
      setShowMembers(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([loadGroupMessages(group.id), loadGroupMembers(group.id)])
      .then(([rows, people]) => {
        if (cancelled) return;
        setMessages(rows);
        setMembers(people);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [group]);


  const meAs = useMemo(() => {
    if (!meId) return null;
    const mine = members.find((m) => m.id === meId);
    if (!mine) return null;
    return { id: mine.id, name: mine.name, initial: mine.initial, color: mine.color };
  }, [meId, members]);

  const refetch = useCallback(() => {
    if (!group) return;
    loadGroupMessages(group.id).then(setMessages);
  }, [group]);

  const { typists, notifyTyping, notifyStopped } = useGroupChannel({
    groupId: group?.id ?? null,
    me: meAs,
    onChange: refetch,
  });

  const kick = async (profileId: string) => {
    if (!group) return;
    const fd = new FormData();
    fd.set("group_id", group.id);
    fd.set("profile_id", profileId);
    await kickMember({ error: null }, fd);
    setMembers(await loadGroupMembers(group.id));
  };

  useEffect(() => {
    if (!state.ok || !group) return;
    setDraft("");

    loadGroupMessages(group.id).then(setMessages);
    notifyStopped();
  }, [state.ok, group, notifyStopped]);


  useEffect(() => {
    const node = streamRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length, loading, typists.length]);

  return (
    <Modal
      open={Boolean(group)}
      onClose={onClose}
      title={group?.name ?? "Grup"}
      description={group ? `${group.members} anggota` : undefined}
      size="lg"
    >
      {group && (
        <div className="flex flex-col">
          <div
            ref={streamRef}
            className="relative max-h-[52vh] min-h-[240px] overflow-y-auto overscroll-contain rounded-2xl px-3 py-4"
            style={{ backgroundColor: WALLPAPER }}
          >
            <HealthPattern className="text-[#6d5647]" opacity={0.13} />

            {loading && (
              <p className="relative py-8 text-center text-[14px] text-neutral-500">
                Memuat obrolan…
              </p>
            )}

            {!loading && messages.length === 0 && (
              <p className="relative mx-auto max-w-[32ch] py-10 text-center text-[14px] leading-6 text-neutral-500">
                Belum ada obrolan di grup ini. Sapa yang pertama.
              </p>
            )}

            <ul className="relative">
              {messages.map((message, i) => {
                const mine = message.authorId === meId;
                const head = i === 0 || messages[i - 1].authorId !== message.authorId;

                return (
                  <li
                    key={message.id}
                    className={`flex gap-2 ${mine ? "flex-row-reverse" : ""} ${
                      head ? "mt-2.5" : "mt-[3px]"
                    }`}
                  >
                    {!mine &&
                      (head ? (
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-full text-[12px] font-bold text-white"
                          style={{ backgroundColor: message.color }}
                        >
                          {message.initial}
                        </span>
                      ) : (
                        <span aria-hidden className="w-8 shrink-0" />
                      ))}

                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-1.5 shadow-[0_1px_2px_rgba(24,32,24,0.06)] sm:max-w-[68%] ${
                        mine
                          ? `bg-karsa text-white ${head ? "rounded-tr-md" : ""}`
                          : `bg-white text-neutral-800 ring-1 ring-karsa-line ${head ? "rounded-tl-md" : ""}`
                      }`}
                    >
                      {head && !mine && (
                        <p className="text-[12px] font-bold text-karsa-dark">{message.author}</p>
                      )}
                      <p className="whitespace-pre-line text-[14.5px] leading-6">{message.body}</p>
                      <p
                        className={`mt-0.5 text-right text-[11px] ${
                          mine ? "text-white/65" : "text-neutral-400"
                        }`}
                      >
                        {message.when}
                      </p>
                    </div>
                  </li>
                );
              })}


              {typists.length === 1 ? (
                <TypingDots
                  name={typists[0].name}
                  color={typists[0].color}
                  initial={typists[0].initial}
                />
              ) : typists.length > 1 ? (
                <TypingDots name={`${typists.length} orang`} />
              ) : null}
            </ul>
          </div>

          {state.error && (
            <p role="alert" className="mt-3 text-[13px] font-semibold text-rose-700">
              {state.error}
            </p>
          )}

          <form action={send} className="mt-3 flex items-end gap-2">
            <input type="hidden" name="group_id" value={group.id} />
            <label htmlFor="group-draft" className="sr-only">
              Tulis pesan
            </label>
            <textarea
              id="group-draft"
              name="body"
              rows={1}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);

                if (event.target.value.trim()) notifyTyping();
                else notifyStopped();
              }}
              disabled={sending}
              placeholder={`Tulis pesan ke ${group.name}…`}
              className="min-h-[48px] flex-1 resize-none rounded-2xl bg-white px-4 py-3 text-[14.5px] leading-5 text-neutral-800 outline-none ring-1 ring-karsa-line placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Kirim pesan"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-karsa text-white outline-none transition-colors hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:opacity-50"
            >
              <Send size={18} strokeWidth={2.2} className="-ml-0.5" />
            </button>
          </form>

          <button
            type="button"
            onClick={() => setShowMembers((v) => !v)}
            aria-expanded={showMembers}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg text-[12.5px] font-semibold text-neutral-500 outline-none transition-colors hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
          >
            <UsersRound size={14} strokeWidth={2.2} aria-hidden />
            {showMembers ? "Sembunyikan anggota" : `Lihat ${members.length} anggota`}
          </button>

          {showMembers && (
            <ul className="mt-3 space-y-2 rounded-2xl bg-karsa-canvas/60 p-2.5 ring-1 ring-karsa-line">
              {members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initial}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-neutral-800">
                      {member.name}
                      {member.isAdmin && (
                        <span className="ml-2 rounded-full bg-karsa-soft px-2 py-0.5 text-[11px] font-bold text-karsa-dark">
                          Admin
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-[12px] text-neutral-500">
                      {member.role}
                    </span>
                  </span>

                  {group.isAdmin && !member.isAdmin && (
                    <button
                      type="button"
                      onClick={() => kick(member.id)}
                      aria-label={`Keluarkan ${member.name}`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-400 outline-none transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-300"
                    >
                      <UserMinus size={16} strokeWidth={2.3} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-[12.5px] text-neutral-500">
            Hanya anggota grup yang bisa membaca obrolan ini.
          </p>
        </div>
      )}
    </Modal>
  );
}
