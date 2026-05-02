// app/page.tsx

"use client"

import { useState } from 'react'
import axios from 'axios'

export default function Home() {
  const [formData, setFormData] = useState({
    error_text: '',
    log_excerpt: '',
    code_file: '',
    service_name: '',
    repo_link: ''
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post(
        'http://localhost:8000/analyze_error',
        formData
      )
      setResult(response.data)
    } catch (error) {
      console.error(error)
    }

    setLoading(false)
  }

  if (result) {
    return <ResultsPage result={result} />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">🔍 Error Debugger</h1>
        <p className="text-gray-600 mb-8">Paste your error and context. We'll find the root cause.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">

          <div>
            <label className="block text-sm font-medium mb-2">Error Message *</label>
            <textarea
              required
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              rows={3}
              placeholder="TimeoutError: POST /api/payments timed out after 30s"
              value={formData.error_text}
              onChange={(e) => setFormData({ ...formData, error_text: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Log Excerpt</label>
            <textarea
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              rows={4}
              placeholder="2025-04-28T14:32:15Z ERROR payment-api: connection timeout..."
              value={formData.log_excerpt}
              onChange={(e) => setFormData({ ...formData, log_excerpt: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Code File (relevant snippet)</label>
            <textarea
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              rows={4}
              placeholder="def process_payment(order):..."
              value={formData.code_file}
              onChange={(e) => setFormData({ ...formData, code_file: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Service Name *</label>
              <input
                required
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="payment-api"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Repo Link (optional)</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="https://github.com/user/repo"
                value={formData.repo_link}
                onChange={(e) => setFormData({ ...formData, repo_link: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Error"}
          </button>
        </form>
      </div>
    </div>
  )
}

function ResultsPage({ result }: any) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Root Cause */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <h2 className="text-2xl font-bold mb-2">🎯 Root Cause</h2>
          <p className="text-lg text-gray-800">{result.root_cause}</p>
          <p className="text-sm text-gray-600 mt-2">
            File: {result.affected_file} (line {result.affected_line})
          </p>
        </div>

        {/* Confidence */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📊 Confidence</h2>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-blue-600">{(result.confidence.score * 100).toFixed(0)}%</div>
            <div>
              <p className="text-gray-700">{result.confidence.reasoning}</p>
              <p className="text-sm text-gray-600 mt-2">{result.confidence.uncertainty}</p>
            </div>
          </div>
        </div>

        {/* Related Commits */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🔗 Related Commits (Top 3)</h2>
          {result.related_commits.map((commit: any, idx: number) => (
            <div key={idx} className="mb-4 p-4 bg-gray-100 rounded">
              <a href={commit.github_link} className="text-blue-600 font-mono text-sm">{commit.hash}</a>
              <p className="font-medium mt-1">{commit.message}</p>
              <p className="text-sm text-gray-600">Relevance: {commit.relevance_score}</p>
            </div>
          ))}
        </div>

        {/* Similar Incidents */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">⏰ Similar Past Incidents</h2>
          {result.similar_incidents.map((incident: any, idx: number) => (
            <div key={idx} className="mb-4 p-4 bg-blue-50 rounded border-l-4 border-blue-500">
              <h3 className="font-bold">{incident.title}</h3>
              <p className="text-sm text-gray-600 mt-1">Fix: {incident.fix_applied}</p>
              <p className="text-xs text-gray-500">Resolved in {incident.resolution_time} minutes</p>
            </div>
          ))}
        </div>

        {/* Reasoning Chain */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🧠 Reasoning Chain</h2>
          <div className="space-y-3 text-sm">
            <p><strong>What we found:</strong> {result.reasoning_chain.retrieval}</p>
            <p><strong>Analysis:</strong> {result.reasoning_chain.analysis}</p>
            <p><strong>Alternatives:</strong> {JSON.stringify(result.reasoning_chain.alternatives)}</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-bold mb-4">✅ Next Steps</h2>
          <ul className="space-y-2">
            {result.next_steps.map((step: string, idx: number) => (
              <li key={idx} className="flex gap-2">
                <span>•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}