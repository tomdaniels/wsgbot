# wsgbot

Discord bot for running WSG wargame nights: server setup, class role self-assignment, signups, and roster drafting.
A player needs a class role (from `/class-roles`) before they can sign up (`/wargame`), and there needs to be at least one signup before there's anything to roster (`/roster`).

## Commands

Run in this order — each one depends on the last.

### `/setup`
Creates the channels (`#welcome`, `#wargame`, voice channels) and the class + Organizer roles. Run this once per server, or again any time to fill in anything missing.

### `/class-roles`
Posts the reaction-role message (in whatever channel you run it in — put it in `#welcome`). Players react with their class's emoji to get that class role, and remove the reaction to remove it. **Required before `/wargame` signup works** — `/wargame`'s sign-up buttons check a player's class roles to know what they can sign up as.

### `/wargame <date>`
Creates a wargame event and posts the signup panel (Sign Up / Tentative / Absent buttons) in `#wargame`. Players without a class role from `/class-roles` are told to react on the class message first.

### `/roster <event>`
Organizer-only. Opens a draft view to pick the final roster from everyone who signed up to `/wargame`. Does nothing until people have signed up.

