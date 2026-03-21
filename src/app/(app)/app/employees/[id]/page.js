"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  FormControlLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function fmtDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("nl-BE", {
      timeZone: "Europe/Brussels",
    });
  } catch {
    return String(value);
  }
}

function toIsoDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRange(from, to) {
  if (!from || !to) return [];

  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  if (start.getTime() > end.getTime()) return [];

  const result = [];
  const current = new Date(start);

  while (current.getTime() <= end.getTime()) {
    result.push(toIsoDateString(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
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
  if (minutes === "" || minutes == null) return "-";
  const value = Number(minutes);
  if (Number.isNaN(value)) return "-";
  const hours = value / 60;
  return `${hours} u`;
}

function expectedModeLabel(value) {
  if (value === "ROSTER") return "Rooster";
  if (value === "CALENDAR") return "Kalender";
  return "Geen tijdensysteem";
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

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || "";

  const [tab, setTab] = useState(0);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRoster, setSavingRoster] = useState(false);
  const [savingCalendar, setSavingCalendar] = useState(false);

  const [employee, setEmployee] = useState(null);
  const [rosterDays, setRosterDays] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);

  const [name, setName] = useState("");
  const [expectedMode, setExpectedMode] = useState("");

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const [calendarMode, setCalendarMode] = useState("single");
  const [calendarDate, setCalendarDate] = useState("");
  const [calendarMinutes, setCalendarMinutes] = useState("");

  const [calendarFrom, setCalendarFrom] = useState("");
  const [calendarTo, setCalendarTo] = useState("");
  const [calendarRangeDefaultMinutes, setCalendarRangeDefaultMinutes] = useState("");
  const [calendarDraftDays, setCalendarDraftDays] = useState([]);

  const emptyRosterTemplate = useMemo(
    () => [
      { weekday: 1, expectedMinutes: "" },
      { weekday: 2, expectedMinutes: "" },
      { weekday: 3, expectedMinutes: "" },
      { weekday: 4, expectedMinutes: "" },
      { weekday: 5, expectedMinutes: "" },
      { weekday: 6, expectedMinutes: "" },
      { weekday: 7, expectedMinutes: "" },
    ],
    []
  );

  async function loadEmployee() {
    if (!id) {
      setLoading(false);
      setEmployee(null);
      setErr("Geen werknemer-ID gevonden in de URL.");
      return;
    }

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
      setExpectedMode(row?.expectedMode || "");

      const apiRoster = Array.isArray(row?.rosterDays) ? row.rosterDays : [];
      const apiCalendar = Array.isArray(row?.calendarDays) ? row.calendarDays : [];

      const mergedRoster = emptyRosterTemplate.map((baseDay) => {
        const existing = apiRoster.find((d) => Number(d.weekday) === baseDay.weekday);
        return {
          weekday: baseDay.weekday,
          expectedMinutes:
            existing && existing.expectedMinutes != null
              ? Number(existing.expectedMinutes)
              : "",
        };
      });

      const sortedCalendar = [...apiCalendar].sort((a, b) => {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return aTime - bTime;
      });

      setRosterDays(mergedRoster);
      setCalendarDays(sortedCalendar);
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
      const payload = {
        name,
        expectedMode: expectedMode || null,
      };

      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJson(res);
      const row = data.employee || null;

      setEmployee(row);
      setName(row?.name || "");
      setExpectedMode(row?.expectedMode || "");

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
          ? {
              ...row,
              expectedMinutes: value === "" ? "" : Number(value),
            }
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
      const payload = rosterDays
        .filter((d) => d.expectedMinutes !== "" && d.expectedMinutes != null)
        .map((d) => ({
          weekday: Number(d.weekday),
          expectedMinutes: Number(d.expectedMinutes || 0),
        }));

      const res = await fetch(`/api/employees/${id}/roster`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: payload }),
      });

      await readJson(res);
      setInfo("Rooster opgeslagen.");
      await loadEmployee();
    } catch (e) {
      setErr(e?.message || "Rooster opslaan mislukt.");
    } finally {
      setSavingRoster(false);
    }
  }

  async function addSingleCalendarDay() {
    if (!id) return;

    setSavingCalendar(true);
    setErr("");
    setInfo("");

    try {
      if (!calendarDate) {
        throw new Error("Kies eerst een datum.");
      }

      let minutes = null;

      if (calendarMinutes !== "" && calendarMinutes != null) {
        minutes = Number(calendarMinutes);

        if (Number.isNaN(minutes) || minutes < 0) {
          throw new Error("Verwachte minuten mogen niet negatief zijn.");
        }
      }

      const res = await fetch(`/api/employees/${id}/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: calendarDate,
          expectedMinutes: minutes,
        }),
      });

      await readJson(res);

      setCalendarDate("");
      setCalendarMinutes("");
      setInfo("Kalenderdag opgeslagen.");
      await loadEmployee();
    } catch (e) {
      setErr(e?.message || "Kalenderdag opslaan mislukt.");
    } finally {
      setSavingCalendar(false);
    }
  }

  function generateCalendarRangeDraft() {
    setErr("");
    setInfo("");

    if (!calendarFrom || !calendarTo) {
      setErr("Kies eerst een van- en tot-datum.");
      return;
    }

    const dates = getDateRange(calendarFrom, calendarTo);
    if (dates.length === 0) {
      setErr("Ongeldige datumrange.");
      return;
    }

    let defaultMinutes = null;

    if (
      calendarRangeDefaultMinutes !== "" &&
      calendarRangeDefaultMinutes != null
    ) {
      defaultMinutes = Number(calendarRangeDefaultMinutes);

      if (Number.isNaN(defaultMinutes) || defaultMinutes < 0) {
        setErr("Standaard minuten mogen niet negatief zijn.");
        return;
      }
    }

    setCalendarDraftDays(
      dates.map((date) => ({
        date,
        expectedMinutes: defaultMinutes,
      }))
    );

    setInfo(`${dates.length} dagen gegenereerd.`);
  }

  function updateDraftMinutes(date, value) {
    setCalendarDraftDays((prev) =>
      prev.map((row) =>
        row.date === date
          ? {
              ...row,
              expectedMinutes: value === "" ? "" : Number(value),
            }
          : row
      )
    );
  }

  function clearCalendarDraft() {
    setCalendarDraftDays([]);
  }

  async function saveCalendarRange() {
    if (!id) return;

    setSavingCalendar(true);
    setErr("");
    setInfo("");

    try {
      if (calendarDraftDays.length === 0) {
        throw new Error("Genereer eerst een range.");
      }

      for (const row of calendarDraftDays) {
        let minutes = null;

        if (row.expectedMinutes !== "" && row.expectedMinutes != null) {
          minutes = Number(row.expectedMinutes);

          if (Number.isNaN(minutes) || minutes < 0) {
            throw new Error(
              `Verwachte minuten mogen niet negatief zijn voor ${row.date}.`
            );
          }
        }

        const res = await fetch(`/api/employees/${id}/calendar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: row.date,
            expectedMinutes: minutes,
          }),
        });

        await readJson(res);
      }

      const count = calendarDraftDays.length;

      setCalendarFrom("");
      setCalendarTo("");
      setCalendarRangeDefaultMinutes("");
      setCalendarDraftDays([]);
      setInfo(`${count} kalenderdagen opgeslagen.`);
      await loadEmployee();
    } catch (e) {
      setErr(e?.message || "Kalenderdagen opslaan mislukt.");
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
      const res = await fetch(
        `/api/employees/${id}/calendar?date=${encodeURIComponent(date)}`,
        {
          method: "DELETE",
        }
      );

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
                    Profiel + planning ({expectedModeLabel(expectedMode)})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Employee ID: {id || "-"}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Divider />

            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="PROFIEL" />
              <Tab label="ROOSTER" />
              <Tab label="KALENDER" />
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

                    <FormControl fullWidth>
                      <InputLabel id="expected-mode-label">Tijdensysteem</InputLabel>
                      <Select
                        labelId="expected-mode-label"
                        value={expectedMode}
                        label="Tijdensysteem"
                        onChange={(e) => setExpectedMode(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Geen</em>
                        </MenuItem>
                        <MenuItem value="ROSTER">Rooster</MenuItem>
                        <MenuItem value="CALENDAR">Kalender</MenuItem>
                      </Select>
                    </FormControl>

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
                      Rooster per weekdag
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
                              label="Verwachte minuten"
                              type="number"
                              value={row.expectedMinutes}
                              onChange={(e) =>
                                updateRosterMinutes(row.weekday, e.target.value)
                              }
                              sx={{ width: 220 }}
                              placeholder=""
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
                      {savingRoster ? "Opslaan..." : "Rooster opslaan"}
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
                        <Stack spacing={3}>
                          <FormControl>
                            <RadioGroup
                              row
                              value={calendarMode}
                              onChange={(e) => {
                                setCalendarMode(e.target.value);
                                setCalendarDraftDays([]);
                              }}
                            >
                              <FormControlLabel
                                value="single"
                                control={<Radio />}
                                label="1 dag"
                              />
                              <FormControlLabel
                                value="range"
                                control={<Radio />}
                                label="Range"
                              />
                            </RadioGroup>
                          </FormControl>

                          {calendarMode === "single" ? (
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
                                label="Verwachte minuten (optioneel)"
                                type="number"
                                value={calendarMinutes}
                                onChange={(e) => setCalendarMinutes(e.target.value)}
                                sx={{ minWidth: 220 }}
                                placeholder=""
                              />

                              <Button
                                variant="contained"
                                onClick={addSingleCalendarDay}
                                disabled={savingCalendar}
                              >
                                {savingCalendar ? "Opslaan..." : "Toevoegen"}
                              </Button>
                            </Stack>
                          ) : (
                            <Stack spacing={3}>
                              <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={2}
                                alignItems={{ xs: "stretch", md: "center" }}
                              >
                                <TextField
                                  label="Van"
                                  type="date"
                                  value={calendarFrom}
                                  onChange={(e) => setCalendarFrom(e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  sx={{ minWidth: 220 }}
                                />

                                <TextField
                                  label="Tot"
                                  type="date"
                                  value={calendarTo}
                                  onChange={(e) => setCalendarTo(e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  sx={{ minWidth: 220 }}
                                />

                                <TextField
                                  label="Standaard minuten (optioneel)"
                                  type="number"
                                  value={calendarRangeDefaultMinutes}
                                  onChange={(e) =>
                                    setCalendarRangeDefaultMinutes(e.target.value)
                                  }
                                  sx={{ minWidth: 220 }}
                                  placeholder=""
                                />

                                <Button
                                  variant="outlined"
                                  onClick={generateCalendarRangeDraft}
                                  disabled={savingCalendar}
                                >
                                  Genereer dagen
                                </Button>
                              </Stack>

                              {calendarDraftDays.length > 0 ? (
                                <Stack spacing={2}>
                                  <Typography variant="subtitle1" fontWeight={700}>
                                    Range preview
                                  </Typography>

                                  {calendarDraftDays.map((row) => (
                                    <Card key={row.date} variant="outlined">
                                      <CardContent>
                                        <Stack
                                          direction={{ xs: "column", md: "row" }}
                                          spacing={2}
                                          justifyContent="space-between"
                                          alignItems={{ xs: "flex-start", md: "center" }}
                                        >
                                          <Box sx={{ minWidth: 180 }}>
                                            <Typography fontWeight={700}>
                                              {fmtDate(row.date)}
                                            </Typography>
                                          </Box>

                                          <TextField
                                            label="Verwachte minuten (optioneel)"
                                            type="number"
                                            value={row.expectedMinutes ?? ""}
                                            onChange={(e) =>
                                              updateDraftMinutes(row.date, e.target.value)
                                            }
                                            sx={{ width: 260 }}
                                            placeholder=""
                                          />
                                        </Stack>
                                      </CardContent>
                                    </Card>
                                  ))}

                                  <Stack direction="row" spacing={2}>
                                    <Button
                                      variant="contained"
                                      onClick={saveCalendarRange}
                                      disabled={savingCalendar}
                                    >
                                      {savingCalendar ? "Opslaan..." : "Range opslaan"}
                                    </Button>

                                    <Button
                                      variant="text"
                                      onClick={clearCalendarDraft}
                                      disabled={savingCalendar}
                                    >
                                      Wissen
                                    </Button>
                                  </Stack>
                                </Stack>
                              ) : null}
                            </Stack>
                          )}
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
                                    Verwachte tijd: {minutesToHoursLabel(row.expectedMinutes)}
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
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}