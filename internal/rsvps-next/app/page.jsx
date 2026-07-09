"use client"
import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RefreshCw, Download, Plus, Trash2, Check, X } from 'lucide-react'

const SUPABASE_URL = 'https://hzfqvmgwetcszealrfok.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZnF2bWd3ZXRjc3plYWxyZm9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQzNzQxNywiZXhwIjoyMDk4MDEzNDE3fQ.Yai7ltVNO7PuiaIuE06a2Pdnr8vGya7pbFmoNcy5UKk'
const HEADERS = { 'apikey': SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }

const HOTELS = ['Sheraton', 'Novotel Chennai', 'Serene Resort Hyderabad', 'Villa Beach Paradise Chennai']
const PASSWORD = 'rithvikshivani2026'

const eventBadgeStyle = (e) => {
  if (e === 'both') return { background: '#e8f4e8', color: '#2a6b2a' }
  if (e === 'hyderabad') return { background: '#fff3e0', color: '#a35c00' }
  if (e === 'chennai') return { background: '#e8eeff', color: '#2a3fbf' }
  if (e === 'sangeet') return { background: '#fff0f6', color: '#b02070' }
  return {}
}

const typeBadgeStyle = (t) => {
  if (t === 'wedding_full') return { background: '#f3e8ff', color: '#6a2abf' }
  if (t === 'wedding_hyd') return { background: '#fff3e0', color: '#a35c00' }
  if (t === 'wedding_chennai') return { background: '#e8eeff', color: '#2a3fbf' }
  if (t === 'sangeet') return { background: '#fff0f6', color: '#b02070' }
  return {}
}

const typeLabel = (t) => {
  if (t === 'wedding_full') return 'Full'
  if (t === 'wedding_hyd') return 'Hyderabad Only'
  if (t === 'wedding_chennai') return 'Chennai Only'
  if (t === 'sangeet') return 'Sangeet'
  return t || '—'
}

export default function Home() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState('')

  const [rsvps, setRsvps] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [accomFilter, setAccomFilter] = useState([])
  const [accomDropOpen, setAccomDropOpen] = useState(false)
  const accomDropRef = useRef(null)

  const [editing, setEditing] = useState({})

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', guests: 1, events: '', invite_type: '', accommodation: [], transport: false })

  const [activeHotel, setActiveHotel] = useState(0)

  useEffect(() => {
    if (authed) { fetchRsvps(); fetchRooms() }
  }, [authed])

  useEffect(() => {
    const handler = (e) => {
      if (accomDropRef.current && !accomDropRef.current.contains(e.target)) setAccomDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function fetchRsvps() {
    setLoading(true)
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rsvps?select=*&order=created_at.desc`, { headers: HEADERS })
    const data = await r.json()
    setRsvps(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function fetchRooms() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/room_groups?select=*&order=created_at.asc`, { headers: HEADERS })
    const data = await r.json()
    setRooms(Array.isArray(data) ? data : [])
  }

  function tryLogin() {
    if (pw === PASSWORD) { setAuthed(true); setPwErr('') }
    else setPwErr('Incorrect password.')
  }

  const totalGuests = rsvps.reduce((s, r) => s + (Number(r.guests) || 0), 0)
  const hydGuests = rsvps.filter(r => r.events === 'hyderabad' || r.events === 'both').reduce((s, r) => s + (Number(r.guests) || 0), 0)
  const chenGuests = rsvps.filter(r => r.events === 'chennai' || r.events === 'both').reduce((s, r) => s + (Number(r.guests) || 0), 0)

  const filtered = rsvps.filter(r => {
    if (search && !r.name?.toLowerCase().includes(search.toLowerCase())) return false
    if (eventFilter !== 'all' && r.events !== eventFilter) return false
    if (accomFilter.length > 0) {
      const accom = r.accommodation || []
      for (const f of accomFilter) {
        if (f === '__none__') { if (accom.length > 0) return false }
        else { if (!accom.includes(f)) return false }
      }
    }
    return true
  })

  function startEdit(id, field, value) {
    setEditing(e => ({ ...e, [id]: { field, value } }))
  }
  function cancelEdit(id) {
    setEditing(e => { const n = { ...e }; delete n[id]; return n })
  }
  async function saveEdit(id, field, value) {
    const body = { [field]: field === 'guests' ? Number(value) : value }
    await fetch(`${SUPABASE_URL}/rest/v1/rsvps?id=eq.${id}`, {
      method: 'PATCH', headers: { ...HEADERS, 'Prefer': 'return=minimal' }, body: JSON.stringify(body)
    })
    setRsvps(rs => rs.map(r => r.id === id ? { ...r, [field]: body[field] } : r))
    cancelEdit(id)
  }

  async function saveTransport(id, val) {
    await fetch(`${SUPABASE_URL}/rest/v1/rsvps?id=eq.${id}`, {
      method: 'PATCH', headers: { ...HEADERS, 'Prefer': 'return=minimal' }, body: JSON.stringify({ transport: val })
    })
    setRsvps(rs => rs.map(r => r.id === id ? { ...r, transport: val } : r))
  }

  async function deleteRsvp(id, name) {
    if (!window.confirm(`Delete RSVP for ${name}?`)) return
    await fetch(`${SUPABASE_URL}/rest/v1/rsvps?id=eq.${id}`, { method: 'DELETE', headers: HEADERS })
    setRsvps(rs => rs.filter(r => r.id !== id))
  }

  async function addRsvp() {
    if (!addForm.name || !addForm.guests) return
    const body = { name: addForm.name, guests: Number(addForm.guests), events: addForm.events || null, invite_type: addForm.invite_type || null, accommodation: addForm.accommodation, transport: addForm.transport }
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rsvps`, {
      method: 'POST', headers: { ...HEADERS, 'Prefer': 'return=representation' }, body: JSON.stringify(body)
    })
    const data = await r.json()
    if (Array.isArray(data) && data[0]) setRsvps(rs => [data[0], ...rs])
    setAddOpen(false)
    setAddForm({ name: '', guests: 1, events: '', invite_type: '', accommodation: [], transport: false })
  }

  function exportRsvpsCsv() {
    const rows = [['Name', 'Guests', 'Events', 'Invite Type', 'Accommodation', 'Transport', 'Submitted Date']]
    filtered.forEach(r => rows.push([
      r.name, r.guests, r.events || '', typeLabel(r.invite_type),
      (r.accommodation || []).join('; '), r.transport ? 'Yes' : 'No',
      r.created_at ? new Date(r.created_at).toLocaleDateString() : ''
    ]))
    downloadCsv('rsvps.csv', rows)
  }

  function downloadCsv(filename, rows) {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = filename
    a.click()
  }

  function totalAssignedAtHotel(hotel, rsvpId) {
    return rooms.filter(r => r.hotel === hotel).reduce((s, r) => {
      const a = r.assignments || {}
      return s + (Number(a[rsvpId]) || 0)
    }, 0)
  }

  function hotelRsvps(hotel) {
    return rsvps.filter(r => (r.accommodation || []).includes(hotel))
  }

  function unassignedGuests(hotel) {
    return hotelRsvps(hotel).filter(r => totalAssignedAtHotel(hotel, r.id) < (Number(r.guests) || 0))
  }

  function hotelRooms(hotel) {
    return rooms.filter(r => r.hotel === hotel)
  }

  async function addRoom(hotel) {
    const label = window.prompt('Room name/number:')
    if (!label) return
    const body = { hotel, label, room_type: hotel === 'Sheraton' ? 'Standard' : null, assignments: {} }
    const r = await fetch(`${SUPABASE_URL}/rest/v1/room_groups`, {
      method: 'POST', headers: { ...HEADERS, 'Prefer': 'return=representation' }, body: JSON.stringify(body)
    })
    const data = await r.json()
    if (Array.isArray(data) && data[0]) setRooms(rs => [...rs, data[0]])
  }

  async function deleteRoom(id) {
    if (!window.confirm('Delete this room?')) return
    await fetch(`${SUPABASE_URL}/rest/v1/room_groups?id=eq.${id}`, { method: 'DELETE', headers: HEADERS })
    setRooms(rs => rs.filter(r => r.id !== id))
  }

  async function patchRoom(id, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/room_groups?id=eq.${id}`, {
      method: 'PATCH', headers: { ...HEADERS, 'Prefer': 'return=representation' }, body: JSON.stringify(body)
    })
    const data = await r.json()
    if (Array.isArray(data) && data[0]) setRooms(rs => rs.map(r => r.id === id ? data[0] : r))
  }

  async function assignGuest(roomId, rsvpId, count) {
    const room = rooms.find(r => r.id === roomId)
    if (!room) return
    const assignments = { ...(room.assignments || {}), [rsvpId]: (Number(room.assignments?.[rsvpId]) || 0) + Number(count) }
    await patchRoom(roomId, { assignments })
  }

  async function removeFromRoom(roomId, rsvpId) {
    const room = rooms.find(r => r.id === roomId)
    if (!room) return
    const assignments = { ...(room.assignments || {}) }
    delete assignments[rsvpId]
    await patchRoom(roomId, { assignments })
  }

  function exportAccomCsv() {
    const rows = [['Hotel', 'Room', 'Room Type', 'Guest Name', 'Guests Assigned', 'Transport']]
    rooms.forEach(room => {
      const a = room.assignments || {}
      Object.entries(a).forEach(([rsvpId, count]) => {
        const rsvp = rsvps.find(r => String(r.id) === String(rsvpId))
        rows.push([room.hotel, room.label, room.room_type || '', rsvp?.name || rsvpId, count, rsvp?.transport ? 'Yes' : 'No'])
      })
    })
    downloadCsv('accommodation.csv', rows)
  }

  const totalRooms = rooms.length
  const guestsWithHotel = rsvps.filter(r => (r.accommodation || []).length > 0).reduce((s, r) => s + (Number(r.guests) || 0), 0)
  const placedInRooms = (() => {
    const ids = new Set()
    rooms.forEach(room => Object.keys(room.assignments || {}).forEach(id => ids.add(id)))
    return rsvps.filter(r => ids.has(String(r.id))).reduce((s, r) => s + (Number(r.guests) || 0), 0)
  })()
  const noHotelYet = rsvps.filter(r => (r.accommodation || []).length === 0).reduce((s, r) => s + (Number(r.guests) || 0), 0)

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-sm">
          <CardHeader><CardTitle>Wedding RSVPs</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && tryLogin()} />
            {pwErr && <p className="text-sm text-red-500">{pwErr}</p>}
            <Button className="w-full" onClick={tryLogin}>Enter</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Rithvik &amp; Shivani — RSVPs</h1>
      <Tabs defaultValue="rsvps">
        <TabsList className="mb-4">
          <TabsTrigger value="rsvps">RSVPs</TabsTrigger>
          <TabsTrigger value="accommodation">Accommodation</TabsTrigger>
        </TabsList>

        <TabsContent value="rsvps">
          <div className="flex flex-wrap gap-4 mb-6">
            {[
              { label: 'Responses', value: rsvps.length },
              { label: 'Total Guests', value: totalGuests },
              { label: 'Hyderabad', value: hydGuests },
              { label: 'Chennai', value: chenGuests },
            ].map(k => (
              <Card key={k.label} className="flex-1 min-w-[140px]">
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold">{k.value}</div>
                  <div className="text-sm text-gray-500">{k.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-3 items-center">
                <Input placeholder="Search name..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All events</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="hyderabad">Hyderabad</SelectItem>
                    <SelectItem value="chennai">Chennai</SelectItem>
                    <SelectItem value="sangeet">Sangeet</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative" ref={accomDropRef}>
                  <Button variant="outline" onClick={() => setAccomDropOpen(o => !o)}>
                    Accommodation {accomFilter.length > 0 ? `(${accomFilter.length})` : ''}
                  </Button>
                  {accomDropOpen && (
                    <div className="absolute z-50 bg-white border rounded shadow-lg p-3 mt-1 w-64 space-y-2">
                      {[{ label: 'None assigned', value: '__none__' }, ...HOTELS.map(h => ({ label: h, value: h }))].map(opt => (
                        <div key={opt.value} className="flex items-center gap-2">
                          <Checkbox checked={accomFilter.includes(opt.value)} onCheckedChange={c => {
                            setAccomFilter(f => c ? [...f, opt.value] : f.filter(x => x !== opt.value))
                          }} id={`af-${opt.value}`} />
                          <label htmlFor={`af-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-sm text-gray-500 ml-auto">
                  {filtered.length === rsvps.length ? `${rsvps.length} responses` : `${filtered.length} of ${rsvps.length}`}
                </span>
                <Button onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-1" />Add RSVP
                </Button>
                <Button variant="outline" onClick={fetchRsvps} size="icon"><RefreshCw className="w-4 h-4" /></Button>
                <Button variant="outline" onClick={exportRsvpsCsv} size="icon"><Download className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>

          <div className="overflow-x-auto rounded border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  {['#','Name','Guests','Events','Invite Type','Accommodation','Transport','Date',''].map(h => (
                    <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const ed = editing[r.id]
                  return (
                    <tr key={r.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>

                      <td className="px-3 py-2">
                        {ed?.field === 'name' ? (
                          <div className="flex gap-1">
                            <Input value={ed.value} onChange={e => setEditing(x => ({ ...x, [r.id]: { ...x[r.id], value: e.target.value } }))} className="h-7 w-32" />
                            <Button size="icon" className="h-7 w-7" onClick={() => saveEdit(r.id, 'name', ed.value)}><Check className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => cancelEdit(r.id)}><X className="w-3 h-3" /></Button>
                          </div>
                        ) : (
                          <span className="cursor-pointer hover:underline" onClick={() => startEdit(r.id, 'name', r.name)}>{r.name}</span>
                        )}
                      </td>

                      <td className="px-3 py-2">
                        {ed?.field === 'guests' ? (
                          <div className="flex gap-1">
                            <Input type="number" min={1} value={ed.value} onChange={e => setEditing(x => ({ ...x, [r.id]: { ...x[r.id], value: e.target.value } }))} className="h-7 w-16" />
                            <Button size="icon" className="h-7 w-7" onClick={() => saveEdit(r.id, 'guests', ed.value)}><Check className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => cancelEdit(r.id)}><X className="w-3 h-3" /></Button>
                          </div>
                        ) : (
                          <span className="cursor-pointer hover:underline" onClick={() => startEdit(r.id, 'guests', r.guests)}>{r.guests}</span>
                        )}
                      </td>

                      <td className="px-3 py-2">
                        {r.events && <Badge style={eventBadgeStyle(r.events)} className="border-0">{r.events}</Badge>}
                      </td>

                      <td className="px-3 py-2">
                        {r.invite_type && <Badge style={typeBadgeStyle(r.invite_type)} className="border-0">{typeLabel(r.invite_type)}</Badge>}
                      </td>

                      <td className="px-3 py-2 max-w-[200px]">
                        {ed?.field === 'accommodation' ? (
                          <div className="space-y-1">
                            {HOTELS.map(h => (
                              <div key={h} className="flex items-center gap-1 text-xs">
                                <Checkbox checked={(ed.value || []).includes(h)} onCheckedChange={c => {
                                  setEditing(x => ({ ...x, [r.id]: { ...x[r.id], value: c ? [...(x[r.id].value || []), h] : x[r.id].value.filter(v => v !== h) } }))
                                }} id={`ac-${r.id}-${h}`} />
                                <label htmlFor={`ac-${r.id}-${h}`} className="cursor-pointer">{h}</label>
                              </div>
                            ))}
                            <div className="flex gap-1 mt-1">
                              <Button size="icon" className="h-6 w-6" onClick={() => saveEdit(r.id, 'accommodation', ed.value)}><Check className="w-3 h-3" /></Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => cancelEdit(r.id)}><X className="w-3 h-3" /></Button>
                            </div>
                          </div>
                        ) : (
                          <span className="cursor-pointer hover:underline text-xs" onClick={() => startEdit(r.id, 'accommodation', r.accommodation || [])}>
                            {(r.accommodation || []).length > 0 ? (r.accommodation || []).join(', ') : <span className="text-gray-400">None</span>}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2">
                        <Checkbox checked={!!r.transport} onCheckedChange={c => saveTransport(r.id, c)} />
                      </td>

                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </td>

                      <td className="px-3 py-2">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => deleteRsvp(r.id, r.name)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">No responses</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="accommodation">
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="outline" onClick={() => { fetchRsvps(); fetchRooms() }} size="icon"><RefreshCw className="w-4 h-4" /></Button>
            <Button variant="outline" onClick={exportAccomCsv} size="icon"><Download className="w-4 h-4" /></Button>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            {[
              { label: 'Total Rooms', value: totalRooms },
              { label: 'Guests w/ Hotel', value: guestsWithHotel },
              { label: 'Placed in Rooms', value: placedInRooms },
              { label: 'No Hotel Yet', value: noHotelYet },
            ].map(k => (
              <Card key={k.label} className="flex-1 min-w-[140px]">
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold">{k.value}</div>
                  <div className="text-sm text-gray-500">{k.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {HOTELS.map((h, i) => {
              const hr = hotelRooms(h)
              const hg = hotelRsvps(h).reduce((s, r) => s + (Number(r.guests) || 0), 0)
              return (
                <button key={h} onClick={() => setActiveHotel(i)}
                  className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${activeHotel === i ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                  {h}<br /><span className="text-xs font-normal">{hg} guests · {hr.length} rooms</span>
                </button>
              )
            })}
          </div>

          <HotelPanel
            hotel={HOTELS[activeHotel]}
            hotelRooms={hotelRooms(HOTELS[activeHotel])}
            unassigned={unassignedGuests(HOTELS[activeHotel])}
            rsvps={rsvps}
            addRoom={() => addRoom(HOTELS[activeHotel])}
            deleteRoom={deleteRoom}
            patchRoom={patchRoom}
            assignGuest={assignGuest}
            removeFromRoom={removeFromRoom}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add RSVP</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Guests</Label>
              <Input type="number" min={1} value={addForm.guests} onChange={e => setAddForm(f => ({ ...f, guests: e.target.value }))} />
            </div>
            <div>
              <Label>Events</Label>
              <Select value={addForm.events} onValueChange={v => setAddForm(f => ({ ...f, events: v }))}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="hyderabad">Hyderabad</SelectItem>
                  <SelectItem value="chennai">Chennai</SelectItem>
                  <SelectItem value="sangeet">Sangeet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Invite Type</Label>
              <Select value={addForm.invite_type} onValueChange={v => setAddForm(f => ({ ...f, invite_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="wedding_full">Full</SelectItem>
                  <SelectItem value="wedding_hyd">Hyderabad Only</SelectItem>
                  <SelectItem value="wedding_chennai">Chennai Only</SelectItem>
                  <SelectItem value="sangeet">Sangeet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Accommodation</Label>
              <div className="space-y-2">
                {HOTELS.map(h => (
                  <div key={h} className="flex items-center gap-2">
                    <Checkbox checked={addForm.accommodation.includes(h)} onCheckedChange={c => {
                      setAddForm(f => ({ ...f, accommodation: c ? [...f.accommodation, h] : f.accommodation.filter(x => x !== h) }))
                    }} id={`add-ac-${h}`} />
                    <label htmlFor={`add-ac-${h}`} className="text-sm cursor-pointer">{h}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={addForm.transport} onCheckedChange={c => setAddForm(f => ({ ...f, transport: c }))} id="add-transport" />
              <label htmlFor="add-transport" className="text-sm cursor-pointer">Transport</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addRsvp}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HotelPanel({ hotel, hotelRooms, unassigned, rsvps, addRoom, deleteRoom, patchRoom, assignGuest, removeFromRoom }) {
  const [assignState, setAssignState] = useState({})

  function getRemaining(rsvp) {
    const total = Number(rsvp.guests) || 0
    const assigned = hotelRooms.reduce((s, r) => s + (Number((r.assignments || {})[rsvp.id]) || 0), 0)
    return Math.max(0, total - assigned)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Rooms</h3>
          <Button size="sm" onClick={addRoom}><Plus className="w-3 h-3 mr-1" />Add Room</Button>
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {hotelRooms.map(room => (
            <RoomCard key={room.id} room={room} hotel={hotel} rsvps={rsvps} patchRoom={patchRoom} deleteRoom={deleteRoom} removeFromRoom={removeFromRoom} />
          ))}
          {hotelRooms.length === 0 && <p className="text-gray-400 text-sm">No rooms yet</p>}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Unassigned Guests</h3>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {unassigned.map(rsvp => {
            const remaining = getRemaining(rsvp)
            const state = assignState[rsvp.id] || { count: remaining, roomId: '' }
            return (
              <div key={rsvp.id} className="border rounded p-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{rsvp.name}</span>
                  <span className="text-xs text-gray-500">{remaining} of {rsvp.guests} left</span>
                </div>
                <div className="flex gap-2">
                  <Input type="number" min={1} max={remaining} value={state.count} className="h-7 w-16"
                    onChange={e => setAssignState(s => ({ ...s, [rsvp.id]: { ...state, count: e.target.value } }))} />
                  <select className="border rounded text-xs px-2 flex-1" value={state.roomId}
                    onChange={e => setAssignState(s => ({ ...s, [rsvp.id]: { ...state, roomId: e.target.value } }))}>
                    <option value="">Select room...</option>
                    {hotelRooms.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  <Button size="sm" className="h-7 text-xs" onClick={async () => {
                    if (!state.roomId || !state.count) return
                    await assignGuest(state.roomId, rsvp.id, state.count)
                    setAssignState(s => { const n = { ...s }; delete n[rsvp.id]; return n })
                  }}>Assign</Button>
                </div>
              </div>
            )
          })}
          {unassigned.length === 0 && <p className="text-gray-400 text-sm">All guests assigned!</p>}
        </div>
      </div>
    </div>
  )
}

function RoomCard({ room, hotel, rsvps, patchRoom, deleteRoom, removeFromRoom }) {
  const [editLabel, setEditLabel] = useState(false)
  const [labelVal, setLabelVal] = useState(room.label)

  const assignments = room.assignments || {}
  const totalInRoom = Object.values(assignments).reduce((s, c) => s + Number(c), 0)

  async function saveLabel() {
    await patchRoom(room.id, { label: labelVal })
    setEditLabel(false)
  }

  return (
    <Card>
      <CardContent className="pt-3 pb-3">
        <div className="flex items-center justify-between mb-2">
          {editLabel ? (
            <div className="flex gap-1">
              <Input value={labelVal} onChange={e => setLabelVal(e.target.value)} className="h-7 w-28" />
              <Button size="icon" className="h-7 w-7" onClick={saveLabel}><Check className="w-3 h-3" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditLabel(false)}><X className="w-3 h-3" /></Button>
            </div>
          ) : (
            <span className="font-medium cursor-pointer hover:underline" onClick={() => setEditLabel(true)}>{room.label}</span>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="outline">{totalInRoom} guests</Badge>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => deleteRoom(room.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {hotel === 'Sheraton' && (
          <select className="border rounded text-xs px-2 py-1 mb-2 w-full"
            value={room.room_type || 'Standard'}
            onChange={e => patchRoom(room.id, { room_type: e.target.value })}>
            <option value="Standard">Standard</option>
            <option value="Suite">Suite</option>
            <option value="Villa">Villa</option>
          </select>
        )}

        <div className="space-y-1">
          {Object.entries(assignments).map(([rsvpId, count]) => {
            const rsvp = rsvps.find(r => String(r.id) === String(rsvpId))
            const total = Number(rsvp?.guests) || 0
            const partial = Number(count) < total
            return (
              <div key={rsvpId} className="flex items-center justify-between text-sm">
                <span>{rsvp?.name || rsvpId}{partial ? <span className="text-xs text-gray-400 ml-1">({count} of {total})</span> : null}</span>
                <Button size="icon" variant="ghost" className="h-5 w-5 text-gray-400 hover:text-red-500" onClick={() => removeFromRoom(room.id, rsvpId)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )
          })}
          {Object.keys(assignments).length === 0 && <p className="text-xs text-gray-400">No guests assigned</p>}
        </div>
      </CardContent>
    </Card>
  )
}
