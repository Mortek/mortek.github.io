import { Composition } from "remotion";
import { BookShort, BOOK_SHORT_DURATION } from "./books/BookShort";
import { whole } from "./books/data";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="WholeShort"
        component={BookShort}
        durationInFrames={BOOK_SHORT_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ book: whole }}
      />
    </>
  );
};
