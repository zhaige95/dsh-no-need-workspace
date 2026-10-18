window.__ModuleLoader__.load({
  id: 'no-need-workspace',
  factory(require) {
    const React = require('react')
    const ReactDOM = require('react-dom')
    const h = React.createElement

    const NS = 'no-need-workspace'
    const ENSURE_ROUTE = '/no-need-workspace/ensure-bucket'
    const CREATE_HEADER = 'x-no-need-workspace'
    const SERVICE_UNAVAILABLE = 'no-need-workspace/service-unavailable'
    const DEFAULT_WORKSPACE_TITLE = 'default-workspace'
    const BUCKET_FOLDER_NAME = 'workspaces'

    /** Simplified Chinese dictionary; English is the fallback chain's tail. */
    const zh = {
      'menu.label': '选择工作区',
      'menu.addWorkspace': '添加工作区…',
      'menu.autoWorkspace': '不使用工作区',
      'menu.autoWorkspaceHint': '选中后不立即创建文件夹；发送第一条消息时才创建以日期时间命名的文件夹，会话统一归入“无需工作区”。',
      'menu.loading': '正在加载工作区…',
      'menu.loadFailed': '无法加载工作区列表',
      'menu.empty': '暂无工作区',
      'menu.preparing': '正在准备…',
      'workspace.default': '默认工作区',
      'workspace.bucketTitle': '无需工作区',
      'error.createFailed': '无法创建工作区：',
      'error.pickerUnavailable': '当前环境不支持系统目录选择，请从侧栏添加工作区。',
      'error.serviceUnavailable': '无需工作区服务不可用，请确认 Host 插件已加载。',
    }

    /** English dictionary. */
    const en = {
      'menu.label': 'Choose workspace',
      'menu.addWorkspace': 'Add workspace…',
      'menu.autoWorkspace': 'No workspace',
      'menu.autoWorkspaceHint': 'No folder is created yet. The first message creates a folder named after the current date and time; such sessions are grouped under “No Need Workspace”.',
      'menu.loading': 'Loading workspaces…',
      'menu.loadFailed': 'Could not load workspaces',
      'menu.empty': 'No workspaces yet',
      'menu.preparing': 'Preparing…',
      'workspace.default': 'Default workspace',
      'workspace.bucketTitle': 'No Need Workspace',
      'error.createFailed': 'Could not create the workspace: ',
      'error.pickerUnavailable': 'This environment has no system directory chooser. Add a workspace from the sidebar instead.',
      'error.serviceUnavailable': 'The No Need Workspace service is unavailable. Check that the Host plugin is loaded.',
    }

    /** Host theme tokens only; the fallbacks keep the menu readable if a token moves. */
    const CSS = [
      '.dshaw-menu{position:fixed;z-index:2147483000;display:flex;flex-direction:column;box-sizing:border-box;min-width:236px;max-width:340px;max-height:min(440px,calc(100vh - 24px));padding:4px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.28));border-radius:10px;background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1,Canvas));color:var(--dsw-alias-label-primary,CanvasText);box-shadow:0 10px 32px rgba(0,0,0,.18);font-size:13px;line-height:20px;',
      '.dshaw-list{display:flex;flex-direction:column;gap:1px;min-height:0;overflow-y:auto;}',
      '.dshaw-item{display:flex;align-items:center;gap:8px;box-sizing:border-box;width:100%;padding:6px 8px;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;outline:none;}',
      '.dshaw-item:hover:not(:disabled),.dshaw-item:focus-visible:not(:disabled){background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.14));}',
      '.dshaw-item:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,Highlight);outline-offset:-2px;}',
      '.dshaw-item:disabled{opacity:.55;cursor:default;}',
      '.dshaw-icon{display:inline-flex;flex:none;width:16px;height:16px;color:var(--dsw-alias-label-secondary,inherit);}',
      '.dshaw-selected .dshaw-icon,.dshaw-selected .dshaw-label{color:var(--dsw-alias-brand-primary,Highlight);}',
      '.dshaw-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dshaw-check{display:inline-flex;flex:none;width:14px;height:14px;color:var(--dsw-alias-brand-primary,Highlight);}',
      '.dshaw-footer{display:flex;flex-direction:column;gap:1px;margin-top:4px;padding-top:4px;border-top:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.28));}',
      '.dshaw-status{padding:6px 8px;color:var(--dsw-alias-label-secondary,inherit);}',
      '.dshaw-error{margin:4px 2px 2px;padding:6px 8px;border-radius:6px;color:var(--dsw-alias-state-error-primary,#c0392b);background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.14));word-break:break-word;}',
    ].join('')

    /** Render one inline folder glyph. */
    function FolderGlyph() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': 'true', focusable: 'false' },
        h('path', {
          d: 'M1.75 4.5c0-.69.56-1.25 1.25-1.25h3.06c.33 0 .65.13.88.37l.94.94h5.12c.69 0 1.25.56 1.25 1.25v6.19c0 .69-.56 1.25-1.25 1.25H3c-.69 0-1.25-.56-1.25-1.25V4.5Z',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.2,
          strokeLinejoin: 'round',
        }),
      )
    }

    /** Render one inline plus glyph. */
    function PlusGlyph() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': 'true', focusable: 'false' },
        h('path', {
          d: 'M8 3.25v9.5M3.25 8h9.5',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
        }),
      )
    }

    /** Render one inline clock glyph. */
    function ClockGlyph() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': 'true', focusable: 'false' },
        h('circle', {
          cx: 8,
          cy: 8,
          r: 6.1,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.2,
        }),
        h('path', {
          d: 'M8 4.6V8l2.4 1.5',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      )
    }

    /** Render one inline check glyph. */
    function CheckGlyph() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', focusable: 'false' },
        h('path', {
          d: 'M3.2 8.4l3 2.9 6.6-6.6',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      )
    }

    /** @param {unknown} error - thrown value. @returns {string} readable text. */
    function messageOf(error) {
      return error instanceof Error ? error.message : String(error)
    }

    /**
     * Whether a picker failure means this composition has no native chooser.
     * @param {unknown} error - thrown value.
     * @returns {boolean} true for the Host's capability refusal.
     */
    function isPickerUnavailable(error) {
      const message = messageOf(error)
      return (
        message.includes('directory-picker/unavailable') ||
        message.includes('needs the native capability') ||
        message.includes('needs the browse capability')
      )
    }

    /**
     * Ask the Host half to ensure the shared bucket workspace directory.
     * @returns {Promise<string>} absolute bucket path.
     */
    async function ensureBucket() {
      let response
      try {
        response = await fetch(ENSURE_ROUTE, {
          method: 'POST',
          headers: { [CREATE_HEADER]: '1' },
          credentials: 'same-origin',
          cache: 'no-store',
        })
      } catch {
        throw new Error(SERVICE_UNAVAILABLE)
      }
      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) throw new Error(SERVICE_UNAVAILABLE)
      let body
      try {
        body = await response.json()
      } catch {
        throw new Error(SERVICE_UNAVAILABLE)
      }
      if (!response.ok || typeof body?.path !== 'string' || body.path === '') {
        throw new Error(typeof body?.error === 'string' ? body.error : `HTTP ${response.status}`)
      }
      return body.path
    }

    /**
     * Occupant of `conversation.hero.workspace`: the blank-session workspace
     * picker plus the "No workspace" action.
     * @param {object} props - owner props, standard selector hooks and injected faces.
     * @returns {import('react').ReactElement | null} the menu portal, or null while closed.
     */
    function AutoWorkspacePicker(props) {
      const {
        open,
        anchorRef,
        selectedId,
        onPick,
        onClose,
        useWorkspaces,
        createWorkspace,
        pickDirectory,
        ensureBucket: requestEnsureBucket,
        renameWorkspace,
        t,
      } = props

      const snapshot = useWorkspaces((state) => state)
      const [busy, setBusy] = React.useState(null)
      const [error, setError] = React.useState(null)
      const [position, setPosition] = React.useState(null)
      const menuRef = React.useRef(null)
      const wasOpen = React.useRef(false)

      React.useEffect(() => {
        if (open) {
          wasOpen.current = true
          setError(null)
          setPosition(null)
          return undefined
        }
        setBusy(null)
        if (wasOpen.current) {
          wasOpen.current = false
          const anchor = anchorRef?.current
          if (anchor && typeof anchor.focus === 'function') anchor.focus()
        }
        return undefined
      }, [open, anchorRef])

      React.useEffect(() => {
        if (!open) return undefined
        const menu = menuRef.current
        if (!menu) return undefined
        const first = menu.querySelector('button:not(:disabled)')
        if (first && typeof first.focus === 'function') first.focus()
        return undefined
      }, [open])

      React.useLayoutEffect(() => {
        if (!open) return undefined
        const menu = menuRef.current
        const anchor = anchorRef?.current
        if (!menu || !anchor) return undefined
        const update = () => {
          const rect = anchor.getBoundingClientRect()
          const width = menu.offsetWidth || 240
          const height = menu.offsetHeight || 0
          const margin = 12
          let left = rect.left
          if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin
          if (left < margin) left = margin
          let top = rect.bottom + 4
          if (height > 0 && top + height > window.innerHeight - margin) {
            const above = rect.top - height - 4
            top = above >= margin ? above : Math.max(margin, window.innerHeight - height - margin)
          }
          setPosition((current) =>
            current && current.left === left && current.top === top ? current : { left, top },
          )
        }
        update()
        const frame = window.requestAnimationFrame(update)
        window.addEventListener('scroll', update, true)
        window.addEventListener('resize', update)
        return () => {
          window.cancelAnimationFrame(frame)
          window.removeEventListener('scroll', update, true)
          window.removeEventListener('resize', update)
        }
      }, [open, anchorRef, snapshot.phase, snapshot.items.length, error, busy])

      React.useEffect(() => {
        if (!open) return undefined
        const handlePointerDown = (event) => {
          const target = event.target
          const menu = menuRef.current
          const anchor = anchorRef?.current
          if (menu && target instanceof Node && menu.contains(target)) return
          if (anchor && target instanceof Node && anchor.contains(target)) return
          onClose()
        }
        document.addEventListener('pointerdown', handlePointerDown, true)
        return () => document.removeEventListener('pointerdown', handlePointerDown, true)
      }, [open, anchorRef, onClose])

      React.useEffect(() => {
        if (!open) return undefined
        const handleKeyDown = (event) => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          event.stopPropagation()
          onClose()
          const anchor = anchorRef?.current
          if (anchor && typeof anchor.focus === 'function') anchor.focus()
        }
        document.addEventListener('keydown', handleKeyDown, true)
        return () => document.removeEventListener('keydown', handleKeyDown, true)
      }, [open, anchorRef, onClose])

      /**
       * Keep arrow/Home/End navigation inside the menu.
       * @param {import('react').KeyboardEvent} event - key event on the menu.
       */
      const handleMenuKeyDown = (event) => {
        const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
        if (!keys.includes(event.key)) return
        const menu = menuRef.current
        if (!menu) return
        const buttons = Array.from(menu.querySelectorAll('button:not(:disabled)'))
        if (buttons.length === 0) return
        event.preventDefault()
        const current = buttons.indexOf(document.activeElement)
        let next
        if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = buttons.length - 1
        else if (event.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % buttons.length
        else next = current < 0 ? buttons.length - 1 : (current - 1 + buttons.length) % buttons.length
        buttons[next].focus()
      }

      /**
       * Run one footer action. "Add workspace" registers a picked directory;
       * "No workspace" registers the shared bucket only — the timestamped
       * session folder is created by the Host on the first message.
       * @param {'add' | 'auto'} kind - which footer action.
       */
      const run = async (kind) => {
        if (busy !== null) return
        setBusy(kind)
        setError(null)
        try {
          let workspace
          if (kind === 'add') {
            const path = await pickDirectory()
            if (path === undefined || path === null || path === '') return
            workspace = await createWorkspace({ path })
          } else {
            const path = await requestEnsureBucket()
            workspace = await createWorkspace({ path })
            if (workspace.title === BUCKET_FOLDER_NAME) {
              try {
                workspace = await renameWorkspace(workspace.workspaceId, t('workspace.bucketTitle'))
              } catch {
                /* The derived "workspaces" title is cosmetic; keep it. */
              }
            }
          }
          onClose()
          onPick(workspace.workspaceId)
        } catch (reason) {
          if (messageOf(reason) === SERVICE_UNAVAILABLE) {
            setError(t('error.serviceUnavailable'))
          } else if (kind === 'add' && isPickerUnavailable(reason)) {
            setError(t('error.pickerUnavailable'))
          } else {
            setError(`${t('error.createFailed')}${messageOf(reason)}`)
          }
        } finally {
          setBusy(null)
        }
      }

      /**
       * Pick one existing workspace.
       * @param {string} workspaceId - selected workspace identity.
       */
      const choose = (workspaceId) => {
        if (busy !== null) return
        onClose()
        onPick(workspaceId)
      }

      if (!open) return null

      const items = Array.isArray(snapshot.items) ? snapshot.items : []
      const rows = items.map((workspace) => {
        const selected = workspace.workspaceId === selectedId
        const label =
          workspace.title === DEFAULT_WORKSPACE_TITLE ? t('workspace.default') : workspace.title
        return h(
          'button',
          {
            key: workspace.workspaceId,
            type: 'button',
            role: 'menuitem',
            className: selected ? 'dshaw-item dshaw-selected' : 'dshaw-item',
            disabled: busy !== null,
            onClick: () => choose(workspace.workspaceId),
          },
          h('span', { className: 'dshaw-icon' }, h(FolderGlyph)),
          h('span', { className: 'dshaw-label', title: label }, label),
          selected ? h('span', { className: 'dshaw-check' }, h(CheckGlyph)) : null,
        )
      })

      const status =
        rows.length > 0
          ? null
          : h(
              'div',
              { className: 'dshaw-status' },
              snapshot.phase === 'pending'
                ? t('menu.loading')
                : snapshot.phase === 'error'
                  ? t('menu.loadFailed')
                  : t('menu.empty'),
            )

      const footer = h(
        'div',
        { className: 'dshaw-footer', role: 'presentation' },
        h(
          'button',
          {
            type: 'button',
            role: 'menuitem',
            className: 'dshaw-item',
            disabled: busy !== null,
            onClick: () => run('add'),
          },
          h('span', { className: 'dshaw-icon' }, h(PlusGlyph)),
          h('span', { className: 'dshaw-label' }, t('menu.addWorkspace')),
        ),
        h(
          'button',
          {
            type: 'button',
            role: 'menuitem',
            className: 'dshaw-item',
            disabled: busy !== null,
            title: t('menu.autoWorkspaceHint'),
            onClick: () => run('auto'),
          },
          h('span', { className: 'dshaw-icon' }, h(ClockGlyph)),
          h(
            'span',
            { className: 'dshaw-label' },
            busy === 'auto' ? t('menu.preparing') : t('menu.autoWorkspace'),
          ),
        ),
      )

      const menu = h(
        'div',
        {
          ref: menuRef,
          className: 'dshaw-menu',
          role: 'menu',
          'aria-label': t('menu.label'),
          style: {
            left: position ? position.left : 0,
            top: position ? position.top : 0,
            visibility: position ? 'visible' : 'hidden',
          },
          onKeyDown: handleMenuKeyDown,
        },
        h('div', { className: 'dshaw-list', role: 'presentation' }, status ?? rows),
        footer,
        error !== null ? h('div', { className: 'dshaw-error', role: 'alert' }, error) : null,
      )

      return ReactDOM.createPortal(menu, document.body)
    }

    /**
     * Browser half: locale resources, namespaced styles, and the picker occupant.
     * @param {object} ctx - client plugin context.
     */
    function apply(ctx) {
      ctx.effect(() => {
        const style = document.createElement('style')
        style.dataset.dshAutoWorkspace = ''
        style.textContent = CSS
        document.head.append(style)
        return () => {
          style.remove()
        }
      })

      ctx.effect(() => {
        const disposers = [
          ctx.locale.register(NS, 'zh', zh),
          ctx.locale.register(NS, 'en', en),
        ]
        return () => {
          for (const dispose of disposers) dispose()
        }
      })

      const injected = () => ({
        createWorkspace: (input) => ctx.workspaces.create(input),
        renameWorkspace: (workspaceId, title) => ctx.workspaces.rename(workspaceId, title),
        pickDirectory: () => ctx.uiWorkspace.pickDirectory(),
        ensureBucket,
      })

      ctx.slots.inject('conversation.hero.workspace', () =>
        ctx.slots.register(
          {
            name: 'conversation.hero.workspace',
            priority: -100,
            locale: NS,
            inject: injected,
          },
          AutoWorkspacePicker,
        ),
      )
    }

    return {
      inject: ['slots', 'locale', 'workspaces', 'uiWorkspace'],
      apply,
    }
  },
})
