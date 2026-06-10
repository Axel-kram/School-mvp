import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { useProfile } from '../hooks/useProfile'
import { chat as chatApi, ChatMsg, sessions } from '../lib/api'

export function ChatPage() {
  const navigate = useNavigate()
  const { currentSubject, gradeGoals, studentProfile } = useProfile()
  const goal = gradeGoals[currentSubject] ?? 'A'

  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStarted, setSessionStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sessions.start(currentSubject, 'chat').then(id => {
      setSessionId(id)
      setSessionStarted(true)
    }).catch(() => setSessionStarted(true))
  }, [currentSubject])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    if (sessionId) {
      await chatApi.saveMessage(sessionId, 'user', text).catch(() => {})
    }

    try {
      const strengths = studentProfile?.strengths?.[currentSubject] ?? []
      const weaknesses = studentProfile?.weaknesses?.[currentSubject] ?? []
      const reply = await chatApi.send(
        sessionId ?? '',
        currentSubject,
        goal,
        [...messages, userMsg],
        strengths,
        weaknesses,
      )
      const assistantMsg: ChatMsg = { role: 'assistant', content: reply }
      setMessages(prev => [...prev, assistantMsg])
      if (sessionId) {
        await chatApi.saveMessage(sessionId, 'assistant', reply).catch(() => {})
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Något gick fel — kontrollera din anslutning och försök igen.',
      }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="app-shell">
      <TopBar showSubjects={false} title={`Chatt · ${currentSubject}`} onBack={() => navigate('/dashboard')} />
      <main className="page-content" style={{ display: 'flex', flexDirection: 'column', paddingBottom: 140 }}>

        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text1)', marginBottom: 8 }}>
              Fråga om {currentSubject}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
              Jag förklarar, ställer motfrågor och anpassar allt till ditt mål: {goal}.
              Inga svar serveras rakt av — du tänker själv med lite hjälp på vägen.
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                `Vad är det viktigaste att kunna i ${currentSubject} för ${goal}?`,
                'Kan du förklara det här på ett enklare sätt?',
                'Varför är det så här?',
              ].map(q => (
                <button
                  key={q}
                  className="nudge"
                  onClick={() => { setInput(q); }}
                  style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg2)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text1)',
                  fontSize: 14,
                  lineHeight: 1.6,
                  border: msg.role === 'assistant' ? '0.5px solid var(--border)' : 'none',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: '14px 14px 14px 4px',
                background: 'var(--bg2)',
                border: '0.5px solid var(--border)',
                fontSize: 14,
                color: 'var(--text3)',
              }}>
                Tänker…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input bar — fixed above bottom nav */}
      <div style={{
        position: 'fixed',
        bottom: 64,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: 'var(--bg0)',
        borderTop: '0.5px solid var(--border)',
        padding: '10px 16px',
        display: 'flex',
        gap: 8,
        zIndex: 9,
      }}>
        <textarea
          className="textarea"
          placeholder={`Fråga om ${currentSubject}…`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading || !sessionStarted}
          style={{ resize: 'none', minHeight: 'unset', padding: '8px 12px', fontSize: 14 }}
        />
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={!input.trim() || loading || !sessionStarted}
          style={{ width: 'auto', padding: '8px 16px', flexShrink: 0 }}
        >
          →
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
