import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('overview')
  const [leads, setLeads] = useState([])
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [copiedResponse, setCopiedResponse] = useState(false)
  const [copiedLeadResponse, setCopiedLeadResponse] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAnalyzeLead = async () => {
    if (!message.trim()) {
      return
    }

    setIsAnalyzing(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/analyze-lead',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to analyze lead')
      }

      setAnalysis(data.analysis)

      try {
        const leadsResponse = await fetch(
          'http://127.0.0.1:8000/api/leads'
        )

        const leadsData = await leadsResponse.json()

        setLeads(leadsData.leads)
      } catch (refreshError) {
        console.error('Failed to refresh leads:', refreshError)
      }
    } catch (err) {
      console.error('Lead analysis failed:', err)
      setError('Unable to analyze this lead. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCopyResponse = async () => {
    if (!analysis?.suggested_response) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        analysis.suggested_response
      )

      setCopiedResponse(true)

      setTimeout(() => {
        setCopiedResponse(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy response:', error)
    }
  }

  const handleCopyLeadResponse = async () => {
    if (!selectedLead?.suggested_response) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        selectedLead.suggested_response
      )

      setCopiedLeadResponse(true)

      setTimeout(() => {
        setCopiedLeadResponse(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy lead response:', error)
    }
  }

  const handleDeleteLead = async () => {
  if (!selectedLead) {
    return
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete Lead #${selectedLead.id}?`
  )

  if (!confirmed) {
    return
  }

  setIsDeleting(true)
  setError('')

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/leads/${selectedLead.id}`,
      {
        method: 'DELETE',
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to delete lead')
    }

    const leadsResponse = await fetch(
      'http://127.0.0.1:8000/api/leads'
    )

    const leadsData = await leadsResponse.json()

    setLeads(leadsData.leads)
    setSelectedLead(null)
    setActivePage('leads')
  } catch (err) {
    console.error('Lead deletion failed:', err)
    setError('Unable to delete this lead. Please try again.')
  } finally {
    setIsDeleting(false)
  }
}

  const handleLeadClick = (lead) => {
    setSelectedLead(lead)
    setActivePage('lead-details')
  }

  const totalLeads = leads.length

  const qualifiedLeads = leads.filter(
    (lead) => lead.lead_status === 'Qualified'
  ).length

  const highPriorityLeads = leads.filter(
    (lead) => lead.priority === 'High'
  ).length

  const needsFollowUp = leads.filter(
    (lead) => lead.lead_status === 'Needs Information'
  ).length

  const filteredLeads = leads.filter((lead) => {
    const search = searchTerm.toLowerCase().trim()

    const matchesSearch =
      !search ||
      lead.business_type?.toLowerCase().includes(search) ||
      lead.service?.toLowerCase().includes(search) ||
      lead.customer_message?.toLowerCase().includes(search)

    const matchesPriority =
      priorityFilter === 'All' ||
      lead.priority === priorityFilter

    const matchesStatus =
      statusFilter === 'All' ||
      lead.lead_status === statusFilter

    return matchesSearch && matchesPriority && matchesStatus
  })

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/leads')
      .then((response) => response.json())
      .then((data) => {
        setLeads(data.leads)
      })
      .catch((error) => {
        console.error('Failed to fetch leads:', error)
      })
  }, [])

  const navigateTo = (page) => {
    if (page === 'new-lead') {
      setMessage('')
      setAnalysis(null)
      setError('')
      setCopiedResponse(false)
    }

    setActivePage(page)
  }

  const clearLeadFilters = () => {
    setSearchTerm('')
    setPriorityFilter('All')
    setStatusFilter('All')
  }

  const getStatusClass = (status) => {
    if (status === 'Qualified') {
      return 'qualified'
    }

    if (status === 'Needs Information') {
      return 'follow-up'
    }

    return 'not-qualified'
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">AL</div>

          <div>
            <h1>AI Lead</h1>
            <span>Assistant</span>
          </div>
        </div>

        <nav className="navigation">
          <button
            className={`nav-item ${
              activePage === 'overview' ? 'active' : ''
            }`}
            onClick={() => navigateTo('overview')}
          >
            <span>Overview</span>
          </button>

<button
  className={`nav-item ${
    activePage === 'leads' || activePage === 'lead-details'
      ? 'active'
      : ''
  }`}
  onClick={() => navigateTo('leads')}
>
  <span>Leads</span>
</button>
        </nav>

        <button
          className="new-lead-button"
          onClick={() => navigateTo('new-lead')}
        >
          + New Lead
        </button>
      </aside>

      <main className="main-content">

        {/* OVERVIEW */}

        {activePage === 'overview' && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Workspace</p>
                <h2>Overview</h2>
              </div>

              <div className="topbar-status">
                AI Assistant
                <span className="status-dot"></span>
              </div>
            </header>

            <section className="welcome-section">
              <p className="eyebrow">Lead management</p>
              <h3>Turn inquiries into qualified leads.</h3>
              <p>
                Analyze customer inquiries, understand their intent,
                and prepare better responses with AI.
              </p>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span>Total Leads</span>
                <strong>{totalLeads}</strong>
              </div>

              <div className="stat-card">
                <span>Qualified</span>
                <strong>{qualifiedLeads}</strong>
              </div>

              <div className="stat-card">
                <span>High Priority</span>
                <strong>{highPriorityLeads}</strong>
              </div>

              <div className="stat-card">
                <span>Needs Follow-up</span>
                <strong>{needsFollowUp}</strong>
              </div>
            </section>

            <section className="recent-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Latest activity</p>
                  <h3>Recent Leads</h3>
                </div>

                <button
                  className="text-button"
                  onClick={() => navigateTo('leads')}
                >
                  View all
                </button>
              </div>

              <div className="lead-table">
                <div className="lead-row lead-header">
                  <span>Lead</span>
                  <span>Service</span>
                  <span>Priority</span>
                  <span>Status</span>
                </div>

                {leads.slice(0, 5).map((lead) => (
                  <div
                    className="lead-row lead-clickable"
                    key={lead.id}
                    onClick={() => handleLeadClick(lead)}
                  >
                    <div>
                      <strong>{lead.business_type}</strong>
                      <span>Lead #{lead.id}</span>
                    </div>

                    <span>{lead.service}</span>

                    <span
                      className={`priority ${lead.priority.toLowerCase()}`}
                    >
                      {lead.priority}
                    </span>

                    <span
                      className={`status ${getStatusClass(
                        lead.lead_status
                      )}`}
                    >
                      {lead.lead_status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* LEADS */}

        {activePage === 'leads' && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Workspace</p>
                <h2>Leads</h2>
              </div>

              <div className="topbar-status">
                AI Assistant
                <span className="status-dot"></span>
              </div>
            </header>

            <section className="welcome-section">
              <p className="eyebrow">Lead management</p>
              <h3>All Leads</h3>
              <p>
                Review and manage customer inquiries analyzed by the AI assistant.
              </p>
            </section>

            <section className="recent-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Lead database</p>
                  <h3>All Leads</h3>
                </div>

                <button
                  className="text-button"
                  onClick={() => navigateTo('new-lead')}
                >
                  + New Lead
                </button>
              </div>

              <div className="lead-filters">
                <div className="lead-search">
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                  />
                </div>

                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(event.target.value)
                  }
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                >
                  <option value="All">All Statuses</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Needs Information">
                    Needs Information
                  </option>
                  <option value="Not Qualified">
                    Not Qualified
                  </option>
                </select>

                <button
                  className="clear-filters-button"
                  type="button"
                  onClick={clearLeadFilters}
                >
                  Clear
                </button>
              </div>

              <div className="lead-result-count">
                Showing {filteredLeads.length} of {leads.length} leads
              </div>

              <div className="lead-table">
                <div className="lead-row lead-header">
                  <span>Lead</span>
                  <span>Service</span>
                  <span>Priority</span>
                  <span>Status</span>
                </div>

                {filteredLeads.length === 0 ? (
                  <div className="empty-leads">
                    <strong>No leads found</strong>
                    <span>
                      Try changing your search or filters.
                    </span>
                  </div>
                ) : (
                  filteredLeads.map((lead) => (
                    <div
                      className="lead-row lead-clickable"
                      key={lead.id}
                      onClick={() => handleLeadClick(lead)}
                    >
                      <div>
                        <strong>{lead.business_type}</strong>
                        <span>Lead #{lead.id}</span>
                      </div>

                      <span>{lead.service}</span>

                      <span
                        className={`priority ${lead.priority.toLowerCase()}`}
                      >
                        {lead.priority}
                      </span>

                      <span
                        className={`status ${getStatusClass(
                          lead.lead_status
                        )}`}
                      >
                        {lead.lead_status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {/* LEAD DETAILS */}

        {activePage === 'lead-details' && selectedLead && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Workspace</p>
                <h2>Lead Details</h2>
              </div>

              <div className="topbar-status">
                AI Assistant
                <span className="status-dot"></span>
              </div>
            </header>

            <section className="welcome-section">
  <div className="lead-details-actions">
    <button
      className="text-button"
      type="button"
      onClick={() => navigateTo('leads')}
    >
      ← Back to Leads
    </button>

    <button
      className="delete-lead-button"
      type="button"
      onClick={handleDeleteLead}
      disabled={isDeleting}
    >
      {isDeleting ? 'Deleting...' : 'Delete Lead'}
    </button>
  </div>

  <p
    className="eyebrow"
    style={{ marginTop: '24px' }}
  >
    Lead #{selectedLead.id}
  </p>

  <h3>{selectedLead.business_type}</h3>

  <p>
    Complete information and AI analysis for this customer inquiry.
  </p>
</section>

            <section className="recent-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Customer inquiry</p>
                  <h3>Original Message</h3>
                </div>
              </div>

              <div className="analysis-content customer-message-content">
               <p>{selectedLead.customer_message}</p>
              </div>
            </section>

            <section className="recent-section analysis-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">AI analysis</p>
                  <h3>Lead Information</h3>
                </div>
              </div>

              <div className="analysis-content">
                <div className="analysis-grid">

                  <div className="analysis-item">
                    <span>Lead Status</span>

                    <div>
                      <span
                        className={`status ${getStatusClass(
                          selectedLead.lead_status
                        )}`}
                      >
                        {selectedLead.lead_status}
                      </span>
                    </div>
                  </div>

                  <div className="analysis-item">
                    <span>Priority</span>

                    <div>
                      <span
                        className={`priority ${selectedLead.priority.toLowerCase()}`}
                      >
                        {selectedLead.priority}
                      </span>
                    </div>
                  </div>

                  <div className="analysis-item">
                    <span>Service</span>
                    <strong>{selectedLead.service}</strong>
                  </div>

                  <div className="analysis-item">
                    <span>Business Type</span>
                    <strong>{selectedLead.business_type}</strong>
                  </div>

                  <div className="analysis-item">
                    <span>Budget</span>
                    <strong>{selectedLead.budget}</strong>
                  </div>

                  <div className="analysis-item">
                    <span>Timeline</span>
                    <strong>{selectedLead.timeline}</strong>
                  </div>

                </div>

                <div className="analysis-block">
                  <span>Missing Information</span>

                  {selectedLead.missing_information.length > 0 ? (
                    <ul>
                      {selectedLead.missing_information.map(
                        (item, index) => (
                          <li key={index}>{item}</li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>No missing information identified.</p>
                  )}
                </div>

                <div className="analysis-block">
                  <span>Summary</span>
                  <p>{selectedLead.summary}</p>
                </div>

                <div className="analysis-block">
                  <div className="response-heading">
                    <span>Suggested Response</span>

                    <button
                      className="copy-response-button"
                      type="button"
                      onClick={handleCopyLeadResponse}
                    >
                      {copiedLeadResponse
                        ? 'Copied'
                        : 'Copy Response'}
                    </button>
                  </div>

                  <p>{selectedLead.suggested_response}</p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* NEW LEAD */}

        {activePage === 'new-lead' && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Workspace</p>
                <h2>New Lead</h2>
              </div>

              <div className="topbar-status">
                AI Assistant
                <span className="status-dot"></span>
              </div>
            </header>

            <section className="welcome-section">
              <p className="eyebrow">Lead management</p>
              <h3>Analyze a new customer inquiry.</h3>
              <p>
                Add the customer's message and let the AI assistant
                extract useful lead information.
              </p>
            </section>

            <section className="recent-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">New inquiry</p>
                  <h3>Customer Message</h3>
                </div>
              </div>

              <div className="lead-form">
                <label htmlFor="customer-message">
                  Customer inquiry
                </label>

                <textarea
                  id="customer-message"
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  placeholder="Example: Hi, I run a clothing brand and need help with social media marketing. My budget is around ₹25,000 per month and I want to start next month."
                  rows="8"
                />

                <div className="form-footer">
                  <span>
                    {message.length} characters
                  </span>

                  <button
                    className="analyze-button"
                    type="button"
                    onClick={handleAnalyzeLead}
                    disabled={!message.trim() || isAnalyzing}
                  >
                    {isAnalyzing && (
                      <span className="button-spinner"></span>
                    )}

                    {isAnalyzing
                      ? 'Analyzing...'
                      : 'Analyze Lead'}
                  </button>
                </div>
              </div>
            </section>

            {error && (
              <div className="analysis-error">
                {error}
              </div>
            )}

            {analysis && (
              <section className="recent-section analysis-section">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">AI analysis</p>
                    <h3>Lead Analysis</h3>
                  </div>
                </div>

                <div className="analysis-content">
                  <div className="analysis-grid">

<div className="analysis-item">
  <span>Lead Status</span>

  <div>
    <span className={`status ${getStatusClass(analysis.lead_status)}`}>
      {analysis.lead_status}
    </span>
  </div>
</div>

<div className="analysis-item">
  <span>Priority</span>

  <div>
    <span className={`priority ${analysis.priority.toLowerCase()}`}>
      {analysis.priority}
    </span>
  </div>
</div>

                    <div className="analysis-item">
                      <span>Service</span>
                      <strong>{analysis.service}</strong>
                    </div>

                    <div className="analysis-item">
                      <span>Business Type</span>
                      <strong>{analysis.business_type}</strong>
                    </div>

                    <div className="analysis-item">
                      <span>Budget</span>
                      <strong>{analysis.budget}</strong>
                    </div>

                    <div className="analysis-item">
                      <span>Timeline</span>
                      <strong>{analysis.timeline}</strong>
                    </div>

                  </div>

                  <div className="analysis-block">
                    <span>Missing Information</span>

                    {analysis.missing_information.length > 0 ? (
                      <ul>
                        {analysis.missing_information.map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p>No missing information identified.</p>
                    )}
                  </div>

                  <div className="analysis-block">
                    <span>Summary</span>
                    <p>{analysis.summary}</p>
                  </div>

                  <div className="analysis-block">
                    <div className="response-heading">
                      <span>Suggested Response</span>

                      <button
                        className="copy-response-button"
                        type="button"
                        onClick={handleCopyResponse}
                      >
                        {copiedResponse
                          ? 'Copied'
                          : 'Copy Response'}
                      </button>
                    </div>

                    <p>{analysis.suggested_response}</p>
                  </div>

                </div>
              </section>
            )}
          </>
        )}

      </main>
    </div>
  )
}

export default App