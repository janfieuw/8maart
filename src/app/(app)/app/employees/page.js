"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";

function fmtDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return String(value);
  }
}

function weekdayLabel(weekday) {
  const map = {
    1: "Maandag",
    2: "Dinsdag",
    3: "Woensdag",
    4: "Donderdag",
    5: "Vrijdag",
    6: "Zaterdag",
    7: "Zondag",
  };
  return map[weekday] || String(weekday);
}

function minutesToHoursLabel(minutes) {
  const value = Number(minutes || 0);
  const hours = value / 60;
  return `${hours} u`;
}

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

export default function EmployeeDetailPage({ params }) {
  const id = params?.id;

  const [tab, setTab] = useState(0);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRoster, setSavingRoster] = useState(false);
  const [savingCalendar, setSavingCalendar] = useState(false);

  const [employee, setEmployee] = useState(null);
  const [rosterDays, setRosterDays] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);

  const [name, setName] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [expectedMode, setExpectedMode] = useState("ROSTER");
  const [active, setActive] = useState(true);

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const [calendarDate, setCalendarDate] = useState("");
  const [calendarMinutes, setCalendarMinutes] = useState(480);

  const rosterTemplate = useMemo(
    () => [
      { weekday: 1, expectedMinutes: 480 },
      { weekday: 2, expectedMinutes: 480 },
      { weekday: 3, expectedMinutes: 480 },
      { weekday: 4, expectedMinutes: 480 },
      { weekday: 5, expectedMinutes: 480 },
      { weekday: 6, expectedMinutes: 0 },
      { weekday: 7, expectedMinutes: 0 },
    ],
    []
  );

  async function loadEmployee() {
    if (!id) return;

    setLoading(true);
    setErr("");
    setInfo("");

    try {
      const res = await fetch(`/api/employees/${id}`, {
        cache: "no-store",
      });

      const data = await readJson(res);

      const row = data.employee || null;
      setEmployee(row);

      setName(row?.name || "");
      setPairCode(row?.pairCode || "");
      setExpectedMode(row?.expectedMode || "ROSTER");
      setActive(!!row?.active);

      const apiRoster = Array.isArray(row?.rosterDays) ? row.rosterDays : [];
      const apiCalendar = Array.isArray(row?.calendarDays) ? row.calendarDays : [];

      const mergedRoster = rosterTemplate.map((baseDay) => {
        const existing = apiRoster.find((d) => Number(d.weekday) === baseDay.weekday);
        return {
          weekday: baseDay.weekday,
          expectedMinutes: existing ? Number(existing.expectedMinutes || 0) : baseDay.expectedMinutes,
        };
      });

      const sortedCalendar = [...apiCalendar].sort((a, b) => {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return aTime - bTime;
      });

      setRosterDays(mergedRoster);
      setCalendarDays(sortedCalendar);
      setLastRefresh(new Date());
    } catch (e) {
      setEmployee(null);
      setRosterDays([]);
      setCalendarDays([]);
      setErr(e?.message || "Werknemer laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployee();
  }, [id]);

  async function saveProfile() {
    if (!id) return;

    setSavingProfile(true);
    setErr("");
    setInfo("");

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          pairCode,
          expectedMode,
          active,
        }),
      });

      const data = await readJson(res);
      const row = data.employee || null;

      setEmployee(row);
      setName(row?.name || "");
      setPairCode(row?.pairCode || "");
      setExpectedMode(row?.expectedMode || "ROSTER");
      setActive(!!row?.active);

      setInfo("Profiel opgeslagen.");
    } catch (e) {
      setErr(e?.message || "Profiel opslaan mislukt.");
    } finally {
      setSavingProfile(false);
    }
  }

  function updateRosterMinutes(weekday, value) {
    setRosterDays((prev) =>
      prev.map((row) =>
        row.weekday === weekday
          ? { ...row, expectedMinutes: Number(value || 0) }
          : row
      )
    );
  }

  async function saveRoster() {
    if (!id) return;

    setSavingRoster(true);
    setErr("");
    setInfo("");

    try {
      const payload = rosterDays.map((d) => ({
        weekday: Number(d.weekday),
        expectedMinutes: Number(d.expectedMinutes || 0),
      }));

      const res = await fetch(`/api/employees/${id}/roster`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: payload }),
      });

      await readJson(res);
      setInfo("Roster opgeslagen.");
      await loadEmployee();
    } catch (e) {
      setErr(e?.message || "Roster opslaan mislukt.");
    } finally {
      setSavingRoster(false);
    }
  }

  async function addCalendarDay() {
    if (!id) return;

    setSavingCalendar(true);
    setErr("");
    setInfo("");

    try {
      if (!calendarDate) {
        throw new Error("Kies eerst een datum.");
      }

      const res = await fetch(`/api/employees/${id}/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: calendarDate,
          expectedMinutes: Number(calendarMinutes || 0),
        }),
      });

      await readJson(res);
      setCalendarDate("");
      setCalendarMinutes(480);
      setInfo("Kalenderdag opgeslagen.");
      await loadEmployee();
    } catch (e) {
      setErr(e?.message || "Kalenderdag opslaan mislukt.");
    } finally {
      setSavingCalendar(false);
    }
  }

  async function deleteCalendarDay(date) {
    if (!id || !date) return;

    setSavingCalendar(true);
    setErr("");
    setInfo("");

    try {
      const res = await fetch(`/api/employees/${id}/calendar?date=${encodeURIComponent(date)}`, {
        method: "DELETE",
      });

      await readJson(res);
      setInfo("Kalenderdag verwijderd.");
      await loadEmployee();
    } catch (e) {
      setErr(e?.message || "Kalenderdag verwijderen mislukt.");
    } finally {
      setSavingCalendar(false);
    }
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  component={Link}
                  href="/app/employees"
                  variant="text"
                  startIcon={<ArrowBackIcon />}
                >
                  Terug
                </Button>

                <Box>
                  <Typography variant="h4" fontWeight={800}>
                    Werknemer detail
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Profiel + planning ({expectedMode || "ROSTER"} of CALENDAR)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Employee ID: {id}
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={loadEmployee}
                disabled={loading}
              >
                Verversen
              </Button>
            </Stack>

            <Divider />

            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="PROFIEL" />
              <Tab label="ROSTER" />
              <Tab label="CALENDAR" />
            </Tabs>

            {err ? <Alert severity="error">{err}</Alert> : null}
            {info ? <Alert severity="success">{info}</Alert> : null}

            {loading ? (
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={20} />
                <Typography>Laden...</Typography>
              </Stack>
            ) : !employee ? (
              <Alert severity="warning">Geen werknemer gevonden.</Alert>
            ) : (
              <>
                {tab === 0 ? (
                  <Stack spacing={3}>
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

                    <FormControl fullWidth>
                      <InputLabel id="expected-mode-label">Expected mode</InputLabel>
                      <Select
                        labelId="expected-mode-label"
                        value={expectedMode}
                        label="Expected mode"
                        onChange={(e) => setExpectedMode(e.target.value)}
                      >
                        <MenuItem value="ROSTER">ROSTER</MenuItem>
                        <MenuItem value="CALENDAR">CALENDAR</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={active}
                          onChange={(e) => setActive(e.target.checked)}
                        />
                      }
                      label="Actief"
                    />

                    <Button
                      variant="contained"
                      onClick={saveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Opslaan..." : "Profiel opslaan"}
                    </Button>
                  </Stack>
                ) : null}

                {tab === 1 ? (
                  <Stack spacing={3}>
                    <Typography variant="h6" fontWeight={700}>
                      Roster per weekdag
                    </Typography>

                    {rosterDays.map((row) => (
                      <Card key={row.weekday} variant="outlined">
                        <CardContent>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={2}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", md: "center" }}
                          >
                            <Box sx={{ minWidth: 180 }}>
                              <Typography fontWeight={700}>
                                {weekdayLabel(row.weekday)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Verwacht: {minutesToHoursLabel(row.expectedMinutes)}
                              </Typography>
                            </Box>

                            <TextField
                              label="Expected minutes"
                              type="number"
                              value={row.expectedMinutes}
                              onChange={(e) =>
                                updateRosterMinutes(row.weekday, e.target.value)
                              }
                              sx={{ width: 220 }}
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}

                    <Button
                      variant="contained"
                      onClick={saveRoster}
                      disabled={savingRoster}
                    >
                      {savingRoster ? "Opslaan..." : "Roster opslaan"}
                    </Button>
                  </Stack>
                ) : null}

                {tab === 2 ? (
                  <Stack spacing={3}>
                    <Typography variant="h6" fontWeight={700}>
                      Kalenderdagen
                    </Typography>

                    <Card variant="outlined">
                      <CardContent>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={2}
                          alignItems={{ xs: "stretch", md: "center" }}
                        >
                          <TextField
                            label="Datum"
                            type="date"
                            value={calendarDate}
                            onChange={(e) => setCalendarDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 220 }}
                          />

                          <TextField
                            label="Expected minutes"
                            type="number"
                            value={calendarMinutes}
                            onChange={(e) => setCalendarMinutes(e.target.value)}
                            sx={{ minWidth: 220 }}
                          />

                          <Button
                            variant="contained"
                            onClick={addCalendarDay}
                            disabled={savingCalendar}
                          >
                            {savingCalendar ? "Opslaan..." : "Toevoegen"}
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>

                    {calendarDays.length === 0 ? (
                      <Alert severity="info">Nog geen kalenderdagen ingesteld.</Alert>
                    ) : (
                      <Stack spacing={2}>
                        {calendarDays.map((row) => (
                          <Card
                            key={`${row.id || row.date}-${row.date}`}
                            variant="outlined"
                          >
                            <CardContent>
                              <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={2}
                                justifyContent="space-between"
                                alignItems={{ xs: "flex-start", md: "center" }}
                              >
                                <Box>
                                  <Typography fontWeight={700}>
                                    {fmtDate(row.date)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Verwacht: {minutesToHoursLabel(row.expectedMinutes)}
                                  </Typography>
                                </Box>

                                <Button
                                  color="error"
                                  onClick={() => deleteCalendarDay(row.date)}
                                  disabled={savingCalendar}
                                >
                                  Verwijderen
                                </Button>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                ) : null}
              </>
            )}

            <Typography variant="caption" color="text.secondary">
              {lastRefresh
                ? `Laatst ververst om ${lastRefresh.toLocaleTimeString()}`
                : "Nog niet ververst."}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}