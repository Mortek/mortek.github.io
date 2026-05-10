# Circle + Logo Pop-In Animation

## Goal
The inner circle (with logo) is hidden at the start of the visualizer. After 1500ms of playback it "pops in" using a spring-scale animation that mimics a bass hit, then continues animating normally.

## State (3 new globals)
- `circleIntroT` — ms elapsed since playback started; resets to 0 on play/render start
- `circleIntroAnimT` — ms into the spring animation; -1 = not started, 0+ = in progress
- `circleIntroDone` — boolean; skips all intro logic once animation completes

## Behavior in `drawFrame`
1. Accumulate `dt` into `circleIntroT` only while audio is playing (`playing` / `sPlaying`)
2. At `circleIntroT >= 1500`: fire animation, set `bgBright = max(bgBright, 0.3)` for white flash
3. Spring animation over 700ms using easeOutElastic — scale goes 0 → ~1.3 → 1.0
4. While hidden (0–1500ms): skip `drawCircle` entirely
5. During animation: wrap `drawCircle` in `ctx.save / translate(W/2,H/2) / scale(s,s) / translate(-W/2,-H/2) / restore`
6. After done: `drawCircle` called normally (no scale wrapper)

## Reset triggers
- Play button (`playPreview`) → reset all three state vars
- Render start (`dlBtn` click) → same reset

## Scope
~35 lines of new code, all in `music_visualizer.html`. No changes to existing functions.
