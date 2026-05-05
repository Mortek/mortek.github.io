export type BookData = {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  asin: string;
  cover: string;
  banner: string;
  hook: string;
  voice: {
    hook: string;
    cover: string;
    cta: string;
  };
  palette: {
    bg: string;
    bgAccent: string;
    text: string;
    accent: string;
  };
};
