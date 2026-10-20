# no-need-workspace

**English** | [简体中文](README.zh-CN.md)

A DeepSeek Harness bundle that adds a **No workspace** action to the blank-session
workspace picker. It defers the folder until the first message and keeps all such
sessions grouped under one **No Need Workspace** parent.

## Preview

![The No workspace option at the bottom of the workspace picker](docs/screenshot.png)

The blank-session workspace picker with **No workspace** selected.

## Behavior

- Clicking **No workspace** only ensures and selects the shared bucket workspace
  at `$DSH_HOME/workspaces`; it does not create a per-session folder.
- The first message in that session creates
  `$DSH_HOME/workspaces/YYYY-MM-DD_HH-mm-ss` (a numeric suffix is added when the
  same second already has a folder) and switches the session's working directory
  to it.
- The session header keeps pointing at the bucket, so the left sidebar shows
  every such session under the **No Need Workspace** group. Timestamped folders
  are not registered as separate workspaces and therefore do not form a folder
  tree.
- The existing **Add workspace…** action still uses the composed directory
  picker; the sidebar `+` action is unchanged.

`$DSH_HOME` is the configured Harness home (`$DSH_HOME`), falling back to
`~/.dsh`. No folders are deleted automatically.

## Install

DSH ships its plugin manager as a bundle. Install `no-need-workspace` from the
Web **Plugins** page by package name, or through the `plugin_manager` agent tool:

```json
{ "action": "install_bundle", "target": "no-need-workspace@0.2.1" }
```

The package declares `dsh.bundle.patch`, so installation selects the bundle and
inserts its single Host/Client row.

## DSH market index

The repository root contains [`market.json`](market.json), a format-1 DSH plugin
market index. Host it at a public HTTPS URL (for example the raw GitHub URL of
this file) and add that URL in DSH **Settings → Plugin Market**. The index lists
the npm source of `0.2.1`; later releases are appended by the `Release` workflow
described below, with the version's publish time as `publishTimestamp`.

## Releasing

1. Bump `version` in [`package.json`](package.json) and commit it on `main`.
2. Tag the commit and push the tag:

   ```bash
   git tag v0.2.1
   git push origin v0.2.1
   ```

The `Release` workflow checks that the tag matches `package.json` and points at a
commit on `main`, publishes the package to npm, then runs
[`scripts/update-market.mjs`](scripts/update-market.mjs) and commits the new
`market.json` entry. It needs an `NPM_TOKEN` repository secret holding an npm
**Automation** token; without it the run stops at the publish step and leaves the
index untouched. Publishing the same version twice is refused by npm, so a rerun
after a partial failure starts from a clean state.

## Compatibility

- Requires DSH `>=0.2.1-rc.2 <0.3.0` (`engines.dsh`).
- The browser half deliberately shadows the shipped
  `conversation.hero.workspace` slot (a `single` slot, registered at priority
  `-100`). It depends on that slot's owner props and on the client
  `workspaces.rename` / `uiWorkspace.pickDirectory` services from the pinned DSH
  line. Re-verify the picker after a DSH upgrade.
- Do not install this package together with another plugin that registers the
  same `/no-need-workspace/ensure-bucket` route, and do not run two
  auto-workspace plugins at once: each would assign its own timestamped folder on
  the first message.

## Security

The Host half registers one loopback-only, same-origin `POST` route guarded by
the `x-no-need-workspace: 1` header. It only creates empty directories under
`$DSH_HOME/workspaces`. It adds no model prompt, tool, or telemetry.

## License

MIT. See [LICENSE](LICENSE).
