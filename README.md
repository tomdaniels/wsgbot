# wsgbot

Discord bot for running WSG wargame nights: server setup, class role self-assignment, signups, and roster drafting.
A player needs a class role (from `/class-roles`) before they can sign up (`/wargame`), and there needs to be at least one signup before there's anything to roster (`/roster`).

## Commands

Run in this order — each one depends on the last.

### `/setup`
Creates the channels (`#welcome`, `#wargame`, voice channels), the class + Organizer roles, and registers `/wargame`, `/roster`, `/class-roles` for this server. Run this once per server, or again any time to fill in anything missing or after a deploy that changed one of those commands' options.

`/setup` itself is registered globally (once, via `src/discord/register-commands.js`), so it's available in any server the bot is invited to with no manual step — invite the bot, run `/setup`, done. The other three commands are guild-scoped and only appear after `/setup` has run in that server.

### `/class-roles`
Posts the reaction-role message (in whatever channel you run it in — put it in `#welcome`). Players react with their class's emoji to get that class role, and remove the reaction to remove it. **Required before `/wargame` signup works** — `/wargame`'s sign-up buttons check a player's class roles to know what they can sign up as.

### `/wargame <date> [faction]`
Creates a wargame event and posts the signup panel (Sign Up / Tentative / Absent buttons) in `#wargame`. Players without a class role from `/class-roles` are told to react on the class message first.

- Omit `faction` for a normal dual-faction event (e.g. an EOI with no confirmed teams yet, or a straight WSG match) — signing up asks for a class (if you have more than one) then a faction (Horde/Alliance).
- Pass `faction` to lock the event to one side — useful for managing just your own team's signups, or handing this bot to an opposing guild so they can run `/wargame <date> alliance` on their own server for their half of a challenge match. Signing up skips the faction step entirely since it's already fixed.

Click Sign Up again any time to swap class or faction (on a dual-faction event), it just overwrites your previous signup. Tentative/Absent don't need a faction.

### `/roster <event> [faction]`
Organizer-only. Opens a draft view to pick the final roster for one faction from everyone signed up to that side. `faction` is only required for a dual-faction event — for a faction-locked `/wargame`, it's derived automatically. Run it once per faction on a dual-faction event — each posts its own roster message (editing it in place on later runs) into the same thread off the signup message. Does nothing until people have signed up for that faction.

