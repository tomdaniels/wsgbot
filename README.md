# wsgbot

Discord bot for running WSG wargame nights: class role self-assignment, faction/dual-faction signups, and roster drafting.
A player needs a class role (from `/class-roles`) before they can sign up (`/wargame`), and there needs to be at least one signup before there's anything to roster (`/roster`).

## Installing on a new server

Invite the bot, then run `/init`.

## Commands

### `/init`
Basic plumbing, nothing else: registers `/wargame`, `/roster`, and `/class-roles` for this server, creates the Organizer role, and creates the voice channels (`#games`, `#pugs`, `#sidebar` — sidebar is Organizer-only, the other two are public).

### `/class-roles`
Finds or creates a `#class-roles` channel and posts (or updates in place) the reaction-role picker there. Players react with these class emoji to get that class role, and remove the reaction to remove it. If it creates the channel, it's read-only, if the channel already exists the permissions are left alone.

### `/wargame <date> [faction]`
Finds or creates a `#wargame` channel and posts a signup panel there. Players without a class role from `/class-roles` are told to react on the class message first.

- Omit `faction` for a dual-faction event (e.g. an EOI with no confirmed teams yet)
- Pass `faction` to lock the event to one side — useful for managing just your own team's signups, and/or handing this bot to an opposing guild you've challenged so they can form their roster

Click Sign Up again any time to swap class or faction.

### `/roster <event> [faction]`
Organizer-only. Opens a draft view to pick the final roster for one faction from everyone signed up to that side. `faction` is only required for a dual-faction event.

