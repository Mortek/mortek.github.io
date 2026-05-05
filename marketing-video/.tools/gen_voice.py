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
# Direct phoneme-string overrides. Maps Kokoro's auto-phonemized output
# to a corrected version. Replacement is plain str.replace(), so order
# matters (longer/more-specific keys first).
PHONEME_OVERRIDES = [
    ("ˈæmɐzˌɑːn", "ˈæməzˌɑːn"),  # Amazon: ɐ -> ə
    ("dˈɑːpɐmˌiːn", "dˈoʊpəmˌiːn"),  # dopamine: DAH -> DOH, ɐ -> ə
]

k = Kokoro(
    "/home/maurice/Projects/mortek.github.io/marketing-video/.tools/kokoro-v1.0.onnx",
    "/home/maurice/Projects/mortek.github.io/marketing-video/.tools/kokoro-voices-v1.0.bin",
)

tok = Tokenizer()
phonemes = tok.phonemize(text, lang="en-us")

for src, dst in PHONEME_OVERRIDES:
    phonemes = phonemes.replace(src, dst)

samples, sr = k.create(phonemes, voice=voice, is_phonemes=True)
sf.write(out_path, samples, sr)
print(f"wrote {out_path} ({len(samples)/sr:.2f}s @ {sr}Hz)")
print(f"  phonemes: {phonemes}")
