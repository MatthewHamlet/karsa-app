"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { ArrowBigUp, MessageCircle, Send, Trash2 } from "lucide-react";
import Modal from "./Modal";
import { Avatar, Tag } from "./CommunityKit";
import { toneForTag } from "./CommunityFeed";
import {
  addComment,
  deleteComment,
  loadPostComments,
  toggleVote,
  type CommunityResult,
} from "../lib/community/actions";
import type { CommunityPost, PostComment } from "../lib/community/queries";

export default function PostDetail({
  post,
  meId,
  onClose,
}: {
  post: CommunityPost | null;
  meId: string | null;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState(0);

  const [state, send, sending] = useActionState<CommunityResult, FormData>(addComment, {
    error: null,
  });

  useEffect(() => {
    if (!post) {
      setComments([]);
      return;
    }
    setVoted(post.voted);
    setVotes(post.upvotes);

    let cancelled = false;
    setLoading(true);
    loadPostComments(post.id)
      .then((rows) => {
        if (!cancelled) setComments(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [post]);

  useEffect(() => {
    if (!state.ok || !post) return;
    setDraft("");
    loadPostComments(post.id).then(setComments);
  }, [state.ok, post]);

  const vote = () => {
    if (!post) return;
    setVoted((v) => !v);
    setVotes((n) => n + (voted ? -1 : 1));
    const fd = new FormData();
    fd.set("post_id", post.id);
    void toggleVote({ error: null }, fd);
  };

  const remove = async (commentId: string) => {
    if (!post) return;
    const fd = new FormData();
    fd.set("comment_id", commentId);
    await deleteComment({ error: null }, fd);
    setComments(await loadPostComments(post.id));
  };

  return (
    <Modal
      open={Boolean(post)}
      onClose={onClose}
      title={post?.title ?? "Postingan"}
      description={post ? `${post.author.name} · ${post.age}` : undefined}
      size="lg"
    >
      {post && (
        <div className="flex flex-col gap-5">
          {post.body && (
            <p className="whitespace-pre-line text-[15px] leading-7 text-neutral-700">
              {post.body}
            </p>
          )}

          {post.imageUrl && (
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-karsa-canvas ring-1 ring-karsa-line">
              <Image
                src={post.imageUrl}
                alt=""
                fill
                sizes="(min-width: 768px) 640px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-karsa-line pb-4">
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Tag key={tag} label={tag} tone={toneForTag(tag)} />
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-4 text-[13px] font-semibold text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle size={15} strokeWidth={2.2} aria-hidden />
                {comments.length}
              </span>
              <button
                type="button"
                onClick={vote}
                aria-pressed={voted}
                aria-label={voted ? "Batalkan dukungan" : "Dukung postingan ini"}
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-karsa/40 ${
                  voted ? "text-karsa-dark" : "hover:text-neutral-700"
                }`}
              >
                <ArrowBigUp
                  size={17}
                  strokeWidth={2.1}
                  aria-hidden
                  className={voted ? "fill-current" : ""}
                />
                {votes}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              Komentar
            </h3>

            {loading && (
              <p className="mt-4 text-[14px] text-neutral-500">Memuat komentar…</p>
            )}

            {!loading && comments.length === 0 && (
              <p className="mt-4 rounded-2xl bg-karsa-canvas/60 px-4 py-6 text-center text-[14px] leading-6 text-neutral-500">
                Belum ada komentar. Jadilah yang pertama menanggapi.
              </p>
            )}

            <ul className="mt-4 space-y-4">
              {comments.map((comment) => (
                <li key={comment.id} className="flex gap-3">
                  <Avatar
                    person={{
                      id: comment.authorId,
                      name: comment.author,
                      role: comment.role,
                      initial: comment.initial,
                      color: comment.color,
                      verified: comment.verified,
                    }}
                    size="sm"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[14px] font-bold text-neutral-800">
                        {comment.author}
                      </span>
                      <span className="text-[12px] text-neutral-400">{comment.when}</span>
                    </p>
                    <p className="mt-1 whitespace-pre-line rounded-2xl rounded-tl-md bg-karsa-canvas/70 px-3.5 py-2.5 text-[14.5px] leading-6 text-neutral-700">
                      {comment.body}
                    </p>
                  </div>

                  {comment.authorId === meId && (
                    <button
                      type="button"
                      onClick={() => remove(comment.id)}
                      aria-label="Hapus komentar"
                      className="grid h-9 w-9 shrink-0 place-items-center self-start rounded-full text-neutral-400 outline-none transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-300"
                    >
                      <Trash2 size={15} strokeWidth={2.2} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {state.error && (
            <p role="alert" className="text-[13px] font-semibold text-rose-700">
              {state.error}
            </p>
          )}

          <form action={send} className="flex items-end gap-2">
            <input type="hidden" name="post_id" value={post.id} />
            <label htmlFor="comment-draft" className="sr-only">
              Tulis komentar
            </label>
            <textarea
              id="comment-draft"
              name="body"
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={sending}
              placeholder="Tulis komentar…"
              className="min-h-[48px] flex-1 resize-none rounded-2xl bg-white px-4 py-3 text-[14.5px] leading-5 text-neutral-800 outline-none ring-1 ring-karsa-line placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Kirim komentar"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-karsa text-white outline-none transition-colors hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40 disabled:opacity-50"
            >
              <Send size={18} strokeWidth={2.2} className="-ml-0.5" />
            </button>
          </form>
        </div>
      )}
    </Modal>
  );
}
