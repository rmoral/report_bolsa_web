"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { getLocaleFromPathname } from "@/i18n/routing";
import { defaultLocale } from "@/i18n/config";

type Post = {
  slug: string;
  title: string;
  excerpt?: string;
  publishedAt?: string;
  featuredImage?: { url?: string; alt?: string } | number | null;
};

export default function LatestPostsWidget() {
  const { t } = useI18n();
  const pathname = usePathname();
  const locale = pathname ? getLocaleFromPathname(pathname) : defaultLocale;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchPosts() {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const res = await fetch(
          `${origin}/api/posts?locale=${locale}&where[status][equals]=published&limit=3&sort=-publishedAt&depth=1`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled) setPosts(data.docs ?? []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPosts();
    return () => { cancelled = true; };
  }, [locale]);

  if (loading) {
    return (
      <section className="container-page py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary] mb-6">
          {t("latest_posts_title")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-gray-50 p-4 animate-pulse">
              <div className="h-32 bg-gray-200 rounded mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || posts.length === 0) {
    return null;
  }

  const dateFormat = locale === "es" ? "es-ES" : "en-US";

  return (
    <section className="bg-white py-12">
      <div className="container-page">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[--color-primary]">
            {t("latest_posts_title")}
          </h2>
          <Link
            href={`/${locale}/blog`}
            className="text-sm font-medium text-[--color-accent] hover:underline"
          >
            {t("latest_posts_view_all")} →
          </Link>
        </div>
        <ul className="grid gap-6 sm:grid-cols-3">
          {posts.map((post) => {
            const imgUrl =
              post.featuredImage &&
              typeof post.featuredImage === "object" &&
              post.featuredImage?.url;
            return (
              <li key={post.slug}>
                <Link
                  href={`/${locale}/blog/${post.slug}`}
                  className="block rounded-lg border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  {imgUrl ? (
                    <span className="relative block aspect-video w-full bg-gray-100">
                      <Image
                        src={imgUrl}
                        alt={
                          post.featuredImage &&
                          typeof post.featuredImage === "object"
                            ? post.featuredImage.alt ?? ""
                            : ""
                        }
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 640px) 100vw, 33vw"
                        unoptimized={imgUrl.startsWith("/")}
                      />
                    </span>
                  ) : (
                    <span className="block aspect-video w-full bg-[--emr-gray] flex items-center justify-center text-gray-400 text-sm">
                      —
                    </span>
                  )}
                  <div className="p-4">
                    <span className="font-semibold text-[--color-primary] group-hover:text-[--color-accent] line-clamp-2">
                      {post.title}
                    </span>
                    {post.publishedAt && (
                      <time
                        className="mt-2 block text-xs text-gray-500"
                        dateTime={post.publishedAt}
                      >
                        {new Date(post.publishedAt).toLocaleDateString(
                          dateFormat
                        )}
                      </time>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
