/**
 * Redes sociales del sitio. Solo se muestran en footer (y donde se usen) las que tengan URL.
 * Para ocultar una red, deja su URL como "" o coméntala.
 */
export type SocialId = "twitter" | "linkedin" | "youtube" | "instagram" | "facebook";

export type SocialLink = {
  id: SocialId;
  /** URL del perfil (vacío = no mostrar) */
  href: string;
};

export const socialLinks: SocialLink[] = [
  // X / Twitter
  { id: "twitter", href: "https://x.com/EMRTechAI" },
  { id: "twitter", href: "https://x.com/EMRMacro" },
  { id: "twitter", href: "https://x.com/EMRTrading" },
  // LinkedIn
  { id: "linkedin", href: "https://www.linkedin.com/company/early-market-reports" },
  // Instagram
  { id: "instagram", href: "https://www.instagram.com/earlymarket_en/" },
  // YouTube
  { id: "youtube", href: "https://www.youtube.com/@EarlyMarketReports" },
].filter((s) => s.href.trim() !== "");
