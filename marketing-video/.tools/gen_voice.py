import sys
import soundfile as sf
from kokoro_onnx import Kokoro
from kokoro_onnx.tokenizer import Tokenizer

if len(sys.argv) < 4:
    print("usage: gen_voice.py <voice> <out.wav> <text>", file=sys.stderr)
    sys.exit(1)

voice, out_path, text = sys.argv[1], sys.argv[2], sys.argv[3]

# Phoneme overrides for words Kokoro mispronounces.
# Maps a word to a phoneme string that replaces the auto-phonemized version.
PHONEME_OVERRIDES = {
    "Amazon": "ˈæməzˌɑːn",
    "Amazon!": "ˈæməzˌɑːn!",
    "Amazon.": "ˈæməzˌɑːn.",
}

k = Kokoro(
    "/home/maurice/Projects/mortek.github.io/marketing-video/.tools/kokoro-v1.0.onnx",
    "/home/maurice/Projects/mortek.github.io/marketing-video/.tools/kokoro-voices-v1.0.bin",
)

tok = Tokenizer()
phonemes = tok.phonemize(text, lang="en-us")

# Per-word phoneme replacement: tokenize source, swap matching words, recombine.
src_words = text.split()
ph_words = phonemes.split()
if len(src_words) == len(ph_words):
    for i, w in enumerate(src_words):
        if w in PHONEME_OVERRIDES:
            ph_words[i] = PHONEME_OVERRIDES[w]
    phonemes = " ".join(ph_words)

samples, sr = k.create(phonemes, voice=voice, is_phonemes=True)
sf.write(out_path, samples, sr)
print(f"wrote {out_path} ({len(samples)/sr:.2f}s @ {sr}Hz)")
print(f"  phonemes: {phonemes}")
