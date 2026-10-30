---
title: Moderating 500 daily anonymous doodles with Jev
date: "2026-10-30"
description: Squigdle lets strangers share drawings anonymously. Here's how I keep it (mostly) clean.
image: https://johalloran.dev/squigdle/img/today-og.png
---

I made [Squigdle](https://johalloran.dev/squigdle/), a daily drawing game. Everyone gets the same three squiggles, turns them into a doodle, then votes on everyone else's.

<video src="/projects/squigdle/Squigdle-quick.mp4" autoplay muted loop playsinline style="width:100%;border-radius:12px"></video>

As you can imagine, a game where strangers share drawings anonymously gets a lot of... you know what. 🍆

## The setup

Before anyone else sees a drawing, the server renders it to a PNG and sends it, with its title, to [Jev](https://typesafe.ai), a model from TypeSafe (that now accepts images!). I picked Jev because it's fast, cheap, and answers with structured data instead of text I'd have to parse.

It's super slick to work with, you define the structure of your response in the form of yes/no or multiple-choice questions, and the input (The doodle)...

```ts
questions: {
  verdict: {
    type: "choice",
    instructions: "Which best describes this drawing and its title?",
    criteria: {
      ok: "Fine for a general audience. Cheeky jokes, butts and innuendo are fine. ...",
      sexual: "Draws a penis, naked breasts WITH nipples, or a sex act. ...",
      // ...plus other criteria like profanity, hateful, etc.
    },
  },
},
```

Those descriptions are the whole policy. Nipples? A line in `sexual`. Butts? A line in `ok`. The trick is putting the forbidden thing in one option and its harmless lookalike in another.

And back comes the verdict:

```js
probabilities: { sexual: 0.90, ok: 0.09 /* ...the rest ~0 */ }
```

Then my code decides what's acceptable, using thresholds I can tweak.

```ts
function decide(p) {
  if (p.ok >= 0.65) return "approved";
  if (p.sexual >= 0.5) return "nsfw";
  // ...a few more rules for the harmful stuff
  return "review";
}
```

Clean drawings go into voting. NSFW ones can still be shared behind a blurred warning, but don't appear to the public in the voting pool. Anything potentially harmful waits for me to verify (through a Discord webhook alert).

![A Squigdle review message in Discord: NSFW, Jev says sexual 90%, ok 9%, with the drawing hidden behind a spoiler](/posts/squigdle-moderation/discord-bot.png)

## Teaching it what's a leg, and what's an extra leg

The squiggles are curvy and blobby, so a lot of innocent doodles end up looking a bit phallic. My codebase has a lot of hints describing what counts as an undeniable 🍆. I've had to make a lot of subjective anatomical decisions over what's allowed and what's suspect. I am, essentially, building Jian Yang's [Not Hotdog](https://www.youtube.com/watch?v=tWwCK95X6go) app.

## How it's going

After ~1,000 doodles, it's holding up really well. The misses are the occasional phallic-looking false alarm, which costs me one tap in Discord. Each check sends a 512×512 PNG plus the title. All 1,000 have cost me 6 cents in total, about $0.00006 per doodle. Your mileage will obviously vary with image size and how much you ask per check.

![The Squigdle admin for day #2: clean doodles with their Jev scores, and an NSFW one (sexual 90%) blurred out](/posts/squigdle-moderation/admin.jpg)

If you want to see what everyone made with today's squiggles, [come check it out!](https://johalloran.dev/squigdle/) (And please don't take this as an open invitation to stress-test the limits of the moderation, it's really designed to be a family friendly game 🙂)

Cheers,
James
