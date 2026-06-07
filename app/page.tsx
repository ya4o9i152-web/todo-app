'use client'

import { useState, useEffect, useRef } from 'react'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

type Filter = 'all' | 'active' | 'completed'

function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('todos')
      if (raw) setTodos(JSON.parse(raw))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos, hydrated])

  const add = (text: string) =>
    setTodos((prev) => [
      { id: crypto.randomUUID(), text, completed: false, createdAt: Date.now() },
      ...prev,
    ])

  const toggle = (id: string) =>
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )

  const update = (id: string, text: string) =>
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text } : t))
    )

  const remove = (id: string) =>
    setTodos((prev) => prev.filter((t) => t.id !== id))

  const clearCompleted = () =>
    setTodos((prev) => prev.filter((t) => !t.completed))

  return { todos, add, toggle, update, remove, clearCompleted, hydrated }
}

const FILTER_LABELS: Record<Filter, string> = {
  all: 'すべて',
  active: '未完了',
  completed: '完了済み',
}

function TodoItem({
  todo,
  onToggle,
  onUpdate,
  onRemove,
  removing,
}: {
  todo: { id: string; text: string; completed: boolean }
  onToggle: () => void
  onUpdate: (text: string) => void
  onRemove: () => void
  removing: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)
  const editRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    if (todo.completed) return
    setDraft(todo.text)
    setEditing(true)
    setTimeout(() => editRef.current?.select(), 0)
  }

  const commitEdit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== todo.text) onUpdate(trimmed)
    else setDraft(todo.text)
    setEditing(false)
  }

  const cancelEdit = () => {
    setDraft(todo.text)
    setEditing(false)
  }

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm transition-all duration-200 ${
        removing ? 'translate-x-2 opacity-0' : 'opacity-100'
      } ${todo.completed ? 'border-slate-100' : 'border-slate-200'}`}
    >
      {/* Complete toggle */}
      <button
        onClick={onToggle}
        aria-label={todo.completed ? '未完了に戻す' : '完了にする'}
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
          todo.completed
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-slate-300 hover:border-emerald-400'
        }`}
      >
        {todo.completed && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Text / inline edit */}
      {editing ? (
        <input
          ref={editRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') cancelEdit()
          }}
          onBlur={commitEdit}
          maxLength={200}
          className="flex-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-0.5 text-sm text-slate-800 outline-none ring-2 ring-indigo-100"
          aria-label="タスクを編集"
        />
      ) : (
        <span
          onDoubleClick={startEdit}
          title={todo.completed ? undefined : 'ダブルクリックで編集'}
          className={`flex-1 break-all text-sm leading-relaxed ${
            todo.completed
              ? 'cursor-default text-slate-400 line-through'
              : 'cursor-text text-slate-800'
          }`}
        >
          {todo.text}
        </span>
      )}

      {/* Edit button (未完了のみ) */}
      {!todo.completed && !editing && (
        <button
          onClick={startEdit}
          aria-label={`"${todo.text}" を編集`}
          className="flex-shrink-0 rounded p-1 text-slate-300 transition hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
            />
          </svg>
        </button>
      )}

      {/* Delete button */}
      {!editing && (
        <button
          onClick={onRemove}
          aria-label={`"${todo.text}" を削除`}
          className="flex-shrink-0 rounded p-1 text-slate-300 transition hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </li>
  )
}

export default function TodoApp() {
  const { todos, add, toggle, update, remove, clearCompleted, hydrated } = useTodos()
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    const text = input.trim()
    if (!text) return
    add(text)
    setInput('')
    inputRef.current?.focus()
  }

  const handleRemove = (id: string) => {
    setRemovingId(id)
    setTimeout(() => {
      remove(id)
      setRemovingId(null)
    }, 250)
  }

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const activeCount = todos.filter((t) => !t.completed).length
  const hasCompleted = todos.some((t) => t.completed)

  if (!hydrated) return null

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-14">
      <div className="mx-auto max-w-md">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">ToDo</h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeCount === 0 && todos.length > 0
              ? 'すべて完了しています 🎉'
              : `残り ${activeCount} 件`}
          </p>
        </header>

        <div className="mb-6 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="タスクを入力して Enter または追加"
            maxLength={200}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            aria-label="新しいタスク"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="タスクを追加"
          >
            追加
          </button>
        </div>

        {todos.length > 0 && (
          <div
            className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1"
            role="tablist"
            aria-label="表示フィルター"
          >
            {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  filter === f
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        )}

        <ul aria-label="タスク一覧" className="space-y-2">
          {filtered.length === 0 ? (
            <li className="py-16 text-center text-sm text-slate-400">
              {filter === 'completed'
                ? '完了済みのタスクはありません'
                : filter === 'active'
                  ? '未完了のタスクはありません ✓'
                  : 'タスクを追加してはじめましょう'}
            </li>
          ) : (
            filtered.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => toggle(todo.id)}
                onUpdate={(text) => update(todo.id, text)}
                onRemove={() => handleRemove(todo.id)}
                removing={removingId === todo.id}
              />
            ))
          )}
        </ul>

        {hasCompleted && (
          <div className="mt-4 text-right">
            <button
              onClick={clearCompleted}
              className="text-xs text-slate-400 underline underline-offset-2 transition hover:text-red-400"
            >
              完了済みをすべて削除
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
