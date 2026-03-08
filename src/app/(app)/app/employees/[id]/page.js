"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Tabs,
  Tab,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateOnlyLocal(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

function dateFromISO(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isoFromDate(date) {
  return toDateOnlyLocal(date);
}

function addDays(iso, days) {
  const d = dateFromISO(iso);
  d.setDate(d.getDate() + days);
  return isoFromDate(d);
}

function startOfWeekISO(iso) {
  const d = dateFromISO(iso);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return isoFromDate(d);
}

function endOfWeekISO(iso) {
  return addDays(startOfWeekISO(iso), 6);
}

function startOfMonthISO(iso) {
  const d = dateFromISO(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
}

function endOfMonthISO(iso) {
  const d = dateFromISO(iso);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return isoFromDate(last);
}

function eachDay(fromISO, toISO) {
  const out = [];
  let cur = fromISO;
  while (cur <= toISO) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

function formatPeriodLabel(view, anchorISO) {
  const d = dateFromISO(anchorISO);
  if (!d) return "-";

  if (view === "day") {
    return d.toLocaleDateString("nl-BE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (view === "week") {
    const from = dateFromISO(startOfWeekISO(anchorISO));
    const to = dateFromISO(endOfWeekISO(anchorISO));

    const sameMonth = from.getMonth() === to.getMonth();
    const sameYear = from.getFullYear() === to.getFullYear();

    if (sameMonth && sameYear) {
      return `${from.getDate()} - ${to.getDate()} ${to.toLocaleDateString("nl-BE", {
        month: "long",
        year: "numeric",
      })}`;
    }

    return `${from.toLocaleDateString("nl-BE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })} - ${to.toLocaleDateString("nl-BE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  }

  return d.toLocaleDateString("nl-BE", {
    month: "long",
    year: "numeric",
  });
}

function fmtMinutes(min) {
  if (min == null || Number.isNaN(Number(min))) return "-";
  const m = Math.max(0, Math.round(Number(min)));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}:${pad2(mm)}`;
}

function minutesFromInput(value) {
  if (value === "" || value == null) return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

function modeChip(mode) {
  const m = String(mode || "").toUpperCase();
  const color = m === "CALENDAR" ? "info" : m === "ROSTER" ? "primary" : "default";
  return <Chip size="small" label={m || "-"} color={color} variant="outlined" />;
}

const WEEKDAYS = [
  { weekday: 1, label: "Maandag" },
  { weekday: 2, label: "Dinsdag" },
  { weekday: 3, label: "Woensdag" },
  { weekday: 4, label: "Donderdag" },
  { weekday: 5, label: "Vrijdag" },
  { weekday: 6, label: "Zaterdag" },
  { weekday: 0, label: "Zondag" },
];

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.id;

  const [tab, setTab] = useState(0);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRoster, setSavingRoster] = useState(false);
  const [savingCalendar, setSavingCalendar] = useState(false);

  const [err, setErr] = useState("");

  const [employee, setEmployee] = useState(null);

  const [name, setName] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [expectedMode, setExpectedMode] = useState("ROSTER");
  const [active, setActive] = useState(true);

  const [roster, setRoster] = useState(() =>
    WEEKDAYS.map((d) => ({ weekday: d.weekday, expectedMinutes: 0 }))
  );

  const [calendarView, setCalendarView] = useState("week");
  const [calendarAnchor, setCalendarAnchor] = useState(() => toDateOnlyLocal(new Date()));
  const [calendarRows, setCalendarRows] = useState([]);
  const [calendarDraft, setCalendarDraft] = useState({});

  const expectedModeIsCalendar = String(expectedMode).toUpperCase() === "CALENDAR";
  const expectedModeIsRoster = String(expectedMode).toUpperCase() === "ROSTER";

  async function readJson(res) {
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || text || `HTTP ${res.status}`);
    }
    return data;
  }

  function getPlannerRange() {
    if (calendarView === "day") {
      return { from: calendarAnchor, to: calendarAnchor };
    }
    if (calendarView === "week") {
      return {
        from: startOfWeekISO(calendarAnchor),
        to: endOfWeekISO(calendarAnchor),
      };
    }
    return {
      from: startOfMonthISO(calendarAnchor),
      to: endOfMonthISO(calendarAnchor),
    };
  }

  const plannerDays = useMemo(() => {
    const { from, to } = getPlannerRange();
    return eachDay(from, to);
  }, [calendarAnchor, calendarView]);

  const plannerLabel = useMemo(
    () => formatPeriodLabel(calendarView, calendarAnchor),
    [calendarView, calendarAnchor]
  );

  async function loadEmployee() {
    setLoading(true);
    setErr("");
    try {
      if (!employeeId) throw new Error("Missing employee id");

      const res = await fetch(`/api/employees/${employeeId}`, { cache: "no-store" });
      const data = await readJson(res);

      const row = data.row;
      setEmployee(row);

      setName(row.name || "");
      setPairCode(row.pairCode || "");
      setExpectedMode(row.expectedMode || "ROSTER");
      setActive(!!row.active);
    } catch (e) {
      setEmployee(null);
      setErr(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadRoster() {
    try {
      if (!employeeId) return;
      const res = await fetch(`/api/employees/${employeeId}/roster`, { cache: "no-store" });
      const data = await readJson(res);

      const map = new Map((data.days || []).map((d) => [d.weekday, d.expectedMinutes]));
      setRoster(
        WEEKDAYS.map((d) => ({
          weekday: d.weekday,
          expectedMinutes: map.get(d.weekday) ?? 0,
        }))
      );
    } catch (e) {
      setErr(e?.message || "Failed to load roster");
    }
  }

  async function loadCalendarPlanner() {
    setErr("");
    try {
      if (!employeeId) throw new Error("Missing employee id");

      const { from, to } = getPlannerRange();
      const qs = new URLSearchParams({ from, to }).toString();
      const res = await fetch(`/api/employees/${employeeId}/calendar?${qs}`, {
        cache: "no-store",
      });
      const data = await readJson(res);

      const rows = Array.isArray(data.rows) ? data.rows : [];
      setCalendarRows(rows);

      const draft = {};
      for (const day of plannerDays) {
        draft[day] = 0;
      }
      for (const r of rows) {
        const day = String(r.date).slice(0, 10);
        draft[day] = Number(r.expectedMinutes) || 0;
      }
      setCalendarDraft(draft);
    } catch (e) {
      setCalendarRows([]);
      setCalendarDraft({});
      setErr(e?.message || "Failed to load calendar");
    }
  }

  async function refreshAll() {
    await loadEmployee();
    await loadRoster();
    await loadCalendarPlanner();
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) {
      loadCalendarPlanner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarAnchor, calendarView]);

  async function saveProfile() {
    setSavingProfile(true);
    setErr("");
    try {
      if (!employeeId) throw new Error("Missing employee id");

      const payload = {
        name: name.trim(),
        pairCode: pairCode.trim(),
        expectedMode,
        active,
      };

      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJson(res);
      setEmployee(data.row);
    } catch (e) {
      setErr(e?.message || "Save failed");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveRoster() {
    setSavingRoster(true);
    setErr("");
    try {
      if (!employeeId) throw new Error("Missing employee id");

      const days = roster.map((d) => ({
        weekday: d.weekday,
        expectedMinutes: minutesFromInput(d.expectedMinutes),
      }));

      const res = await fetch(`/api/employees/${employeeId}/roster`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });

      await readJson(res);
      await loadRoster();
    } catch (e) {
      setErr(e?.message || "Save failed");
    } finally {
      setSavingRoster(false);
    }
  }

  async function saveCalendarPlanner() {
    setSavingCalendar(true);
    setErr("");
    try {
      if (!employeeId) throw new Error("Missing employee id");

      const currentMap = new Map(
        (calendarRows || []).map((r) => [String(r.date).slice(0, 10), Number(r.expectedMinutes) || 0])
      );

      for (const day of plannerDays) {
        const nextVal = minutesFromInput(calendarDraft[day] ?? 0);
        const currentVal = currentMap.has(day) ? currentMap.get(day) : null;

        if (currentVal === nextVal) continue;

        if (nextVal > 0) {
          const res = await fetch(`/api/employees/${employeeId}/calendar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: day,
              expectedMinutes: nextVal,
            }),
          });
          await readJson(res);
          continue;
        }

        if (currentVal !== null && nextVal === 0) {
          const qs = new URLSearchParams({ date: day }).toString();
          const res = await fetch(`/api/employees/${employeeId}/calendar?${qs}`, {
            method: "DELETE",
          });
          await readJson(res);
        }
      }

      await loadCalendarPlanner();
    } catch (e) {
      setErr(e?.message || "Save failed");
    } finally {
      setSavingCalendar(false);
    }
  }

  function movePlanner(delta) {
    if (calendarView === "day") {
      setCalendarAnchor((prev) => addDays(prev, delta));
      return;
    }
    if (calendarView === "week") {
      setCalendarAnchor((prev) => addDays(prev, delta * 7));
      return;
    }
    const d = dateFromISO(calendarAnchor);
    d.setMonth(d.getMonth() + delta);
    setCalendarAnchor(isoFromDate(d));
  }

  function setPlannerToday() {
    setCalendarAnchor(toDateOnlyLocal(new Date()));
  }

  function handlePlannerValueChange(day, value) {
    setCalendarDraft((prev) => ({
      ...prev,
      [day]: minutesFromInput(value),
    }));
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton onClick={() => router.push("/app/employees")} aria-label="Terug">
                  <ArrowBackIcon />
                </IconButton>
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    Werknemer detail
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Profiel + planning (ROSTER of CALENDAR)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Employee ID: {employeeId || "-"}
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={refreshAll}
                disabled={loading}
              >
                Verversen
              </Button>
            </Stack>

            {err ? <Alert severity="error">{err}</Alert> : null}

            <Divider />

            <Tabs value={tab} onChange={(_e, v) => setTab(v)} textColor="inherit">
              <Tab label="PROFIEL" />
              <Tab label="ROSTER" />
              <Tab label="CALENDAR" />
            </Tabs>

            {loading ? (
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2">Laden…</Typography>
              </Stack>
            ) : !employee ? (
              <Alert severity="warning">Geen werknemer gevonden.</Alert>
            ) : (
              <>
                {tab === 0 ? (
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        label="Naam"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="PairCode"
                        value={pairCode}
                        onChange={(e) => setPairCode(e.target.value)}
                        fullWidth
                      />
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
                      <TextField
                        label="ExpectedMode"
                        value={expectedMode}
                        onChange={(e) => setExpectedMode(e.target.value)}
                        select
                        sx={{ width: { xs: "100%", md: 260 } }}
                        helperText={
                          expectedModeIsRoster
                            ? "ROSTER: verwachtte minuten komen uit weekrooster."
                            : "CALENDAR: verwachtte minuten komen uit kalenderplanning."
                        }
                      >
                        <MenuItem value="ROSTER">ROSTER</MenuItem>
                        <MenuItem value="CALENDAR">CALENDAR</MenuItem>
                      </TextField>

                      <FormControlLabel
                        control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
                        label="Actief"
                      />

                      <Box sx={{ flex: 1 }} />

                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={saveProfile}
                        disabled={savingProfile}
                      >
                        Opslaan
                      </Button>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Actieve planning bron:
                      </Typography>
                      {modeChip(expectedMode)}
                    </Stack>
                  </Stack>
                ) : null}

                {tab === 1 ? (
                  <Stack spacing={2}>
                    {!expectedModeIsRoster ? (
                      <Alert severity="info">
                        Deze werknemer staat op <b>ExpectedMode=CALENDAR</b>. Attendance gebruikt dan niet het
                        weekrooster. Als je het rooster wil gebruiken, wijzig ExpectedMode naar <b>ROSTER</b> in de
                        PROFIEL-tab.
                      </Alert>
                    ) : (
                      <Alert severity="success">
                        Deze werknemer staat op <b>ExpectedMode=ROSTER</b>. Attendance gebruikt uitsluitend het
                        weekrooster.
                      </Alert>
                    )}

                    <Typography variant="body2" color="text.secondary">
                      Weekrooster (verwachte minuten per weekdag)
                    </Typography>

                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Weekdag</TableCell>
                            <TableCell>Expected (min)</TableCell>
                            <TableCell>Expected (uur)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {WEEKDAYS.map((d) => {
                            const row = roster.find((r) => r.weekday === d.weekday) || {
                              weekday: d.weekday,
                              expectedMinutes: 0,
                            };

                            return (
                              <TableRow key={d.weekday}>
                                <TableCell>{d.label}</TableCell>
                                <TableCell sx={{ width: 220 }}>
                                  <TextField
                                    type="number"
                                    value={row.expectedMinutes}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setRoster((prev) =>
                                        prev.map((p) =>
                                          p.weekday === d.weekday
                                            ? { ...p, expectedMinutes: minutesFromInput(v) }
                                            : p
                                        )
                                      );
                                    }}
                                    inputProps={{ min: 0, step: 15 }}
                                    fullWidth
                                    disabled={!expectedModeIsRoster}
                                  />
                                </TableCell>
                                <TableCell>{fmtMinutes(row.expectedMinutes)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Stack direction="row" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={saveRoster}
                        disabled={savingRoster || !expectedModeIsRoster}
                      >
                        Opslaan
                      </Button>
                    </Stack>
                  </Stack>
                ) : null}

                {tab === 2 ? (
                  <Stack spacing={2}>
                    {!expectedModeIsCalendar ? (
                      <Alert severity="info">
                        Deze werknemer staat op <b>ExpectedMode=ROSTER</b>. Attendance gebruikt dan uitsluitend het
                        weekrooster en negeert kalenderplanning. Als je de kalender wil gebruiken, wijzig ExpectedMode
                        naar <b>CALENDAR</b> in de PROFIEL-tab.
                      </Alert>
                    ) : (
                      <Alert severity="success">
                        Deze werknemer staat op <b>ExpectedMode=CALENDAR</b>. Attendance gebruikt uitsluitend de
                        kalenderplanning (dag-per-dag).
                      </Alert>
                    )}

                    <Typography variant="body2" color="text.secondary">
                      Kalenderplanning: kies een zichtbare periode en vul per dag het aantal verwachte minuten in.
                      <br />
                      Geen entry op een dag betekent <b>0 minuten verwacht</b>.
                    </Typography>

                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      alignItems={{ xs: "stretch", md: "center" }}
                      justifyContent="space-between"
                    >
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <IconButton onClick={() => movePlanner(-1)} aria-label="Vorige periode">
                          <ChevronLeftIcon />
                        </IconButton>

                        <Button
                          variant="outlined"
                          startIcon={<TodayIcon />}
                          onClick={setPlannerToday}
                        >
                          Vandaag
                        </Button>

                        <IconButton onClick={() => movePlanner(1)} aria-label="Volgende periode">
                          <ChevronRightIcon />
                        </IconButton>

                        <Typography variant="subtitle1" fontWeight={700} sx={{ ml: 1 }}>
                          {plannerLabel}
                        </Typography>
                      </Stack>

                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={calendarView}
                        onChange={(_e, v) => {
                          if (v) setCalendarView(v);
                        }}
                      >
                        <ToggleButton value="day">1 dag</ToggleButton>
                        <ToggleButton value="week">1 week</ToggleButton>
                        <ToggleButton value="month">1 maand</ToggleButton>
                      </ToggleButtonGroup>
                    </Stack>

                    {calendarView === "day" ? (
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {formatPeriodLabel("day", calendarAnchor)}
                          </Typography>

                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                            <TextField
                              label="Expected minutes"
                              type="number"
                              value={calendarDraft[calendarAnchor] ?? 0}
                              onChange={(e) =>
                                handlePlannerValueChange(calendarAnchor, e.target.value)
                              }
                              inputProps={{ min: 0, step: 15 }}
                              sx={{ width: { xs: "100%", sm: 220 } }}
                              disabled={!expectedModeIsCalendar}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Verwachte tijd: {fmtMinutes(calendarDraft[calendarAnchor] ?? 0)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Paper>
                    ) : null}

                    {calendarView === "week" ? (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              {plannerDays.map((day) => (
                                <TableCell key={day}>
                                  <Stack spacing={0.5}>
                                    <Typography variant="body2" fontWeight={700}>
                                      {dateFromISO(day)?.toLocaleDateString("nl-BE", {
                                        weekday: "short",
                                      })}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {day}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              {plannerDays.map((day) => (
                                <TableCell key={day} sx={{ minWidth: 120, verticalAlign: "top" }}>
                                  <Stack spacing={1}>
                                    <TextField
                                      label="Min"
                                      type="number"
                                      size="small"
                                      value={calendarDraft[day] ?? 0}
                                      onChange={(e) =>
                                        handlePlannerValueChange(day, e.target.value)
                                      }
                                      inputProps={{ min: 0, step: 15 }}
                                      disabled={!expectedModeIsCalendar}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      {fmtMinutes(calendarDraft[day] ?? 0)}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : null}

                    {calendarView === "month" ? (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Datum</TableCell>
                              <TableCell>Expected minutes</TableCell>
                              <TableCell>Expected (uur)</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {plannerDays.map((day) => (
                              <TableRow key={day} hover>
                                <TableCell>{day}</TableCell>
                                <TableCell sx={{ width: 220 }}>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={calendarDraft[day] ?? 0}
                                    onChange={(e) =>
                                      handlePlannerValueChange(day, e.target.value)
                                    }
                                    inputProps={{ min: 0, step: 15 }}
                                    fullWidth
                                    disabled={!expectedModeIsCalendar}
                                  />
                                </TableCell>
                                <TableCell>{fmtMinutes(calendarDraft[day] ?? 0)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : null}

                    <Stack direction="row" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={saveCalendarPlanner}
                        disabled={savingCalendar || !expectedModeIsCalendar}
                      >
                        Opslaan zichtbare periode
                      </Button>
                    </Stack>

                    <Typography variant="caption" color="text.secondary">
                      Waarde 0 betekent: geen kalenderentry bewaren voor die dag.
                    </Typography>

                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Datum</TableCell>
                            <TableCell>Expected minutes</TableCell>
                            <TableCell>Expected (uur)</TableCell>
                            <TableCell align="right">Acties</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {calendarRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Geen opgeslagen kalenderdagen in deze zichtbare periode.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            calendarRows.map((r) => {
                              const dateStr = String(r.date).slice(0, 10);
                              return (
                                <TableRow key={r.id} hover>
                                  <TableCell>{dateStr}</TableCell>
                                  <TableCell>{r.expectedMinutes}</TableCell>
                                  <TableCell>{fmtMinutes(r.expectedMinutes)}</TableCell>
                                  <TableCell align="right">
                                    <IconButton
                                      aria-label="Verwijderen"
                                      onClick={async () => {
                                        setSavingCalendar(true);
                                        setErr("");
                                        try {
                                          const qs = new URLSearchParams({ date: dateStr }).toString();
                                          const res = await fetch(
                                            `/api/employees/${employeeId}/calendar?${qs}`,
                                            { method: "DELETE" }
                                          );
                                          await readJson(res);
                                          await loadCalendarPlanner();
                                        } catch (e) {
                                          setErr(e?.message || "Delete failed");
                                        } finally {
                                          setSavingCalendar(false);
                                        }
                                      }}
                                      disabled={savingCalendar || !expectedModeIsCalendar}
                                    >
                                      <DeleteOutlineIcon />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                ) : null}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}