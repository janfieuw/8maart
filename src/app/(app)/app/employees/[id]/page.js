"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

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

function monthTitle(date) {
  try {
    return date.toLocaleDateString("nl-BE", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return `${date.getMonth() + 1}/${date.getFullYear()}`;
  }
}

function getTodayKey() {
  return toIsoDateString(new Date());
}

function isPastDateKey(dateKey) {
  return dateKey < getTodayKey();
}

function extractDateKey(value) {
  if (!value) return "";
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return toIsoDateString(value);
}

function getMonthGrid(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const cells = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    cells.push({
      date,
      key: toIsoDateString(date),
      dayNumber: day,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
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

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [selectedMinutes, setSelectedMinutes] = useState("");

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

  const calendarMap = useMemo(() => {
    const map = {};
    for (const row of calendarDays) {
      const key = extractDateKey(row?.date);
      if (!key) continue;
      map[key] = row?.expectedMinutes ?? 0;
    }
    return map;
  }, [calendarDays]);

  const calendarCells = useMemo(() => getMonthGrid(calendarMonth), [calendarMonth]);

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
        const aKey = extractDateKey(a?.date);
        const bKey = extractDateKey(b?.date);
        return aKey.localeCompare(bKey);
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

  function openCalendarDay(dateKey) {
    if (!dateKey || isPastDateKey(dateKey)) return;

    setSelectedDateKey(dateKey);
    const currentValue = calendarMap[dateKey];
    setSelectedMinutes(
      currentValue === undefined || currentValue === null ? "" : String(currentValue)
    );
    setDialogOpen(true);
  }

  function closeCalendarDialog() {
    if (savingCalendar) return;
    setDialogOpen(false);
    setSelectedDateKey("");
    setSelectedMinutes("");
  }

  async function saveCalendarDay() {
    if (!id || !selectedDateKey) return;

    setSavingCalendar(true);
    setErr("");
    setInfo("");

    try {
      let expectedMinutes = 0;

      if (selectedMinutes !== "" && selectedMinutes != null) {
        expectedMinutes = Number(selectedMinutes);

        if (Number.isNaN(expectedMinutes) || expectedMinutes < 0) {
          throw new Error("Verwachte minuten mogen niet negatief zijn.");
        }
      }

      const res = await fetch(`/api/employees/${id}/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDateKey,
          expectedMinutes,
        }),
      });

      await readJson(res);
      setInfo("Kalenderdag opgeslagen.");
      closeCalendarDialog();
      await loadEmployee();
    } catch (e) {
      setErr(e?.message || "Kalenderdag opslaan mislukt.");
    } finally {
      setSavingCalendar(false);
    }
  }

  async function deleteCalendarDay(dateKey) {
    if (!id || !dateKey || isPastDateKey(dateKey)) return;

    setSavingCalendar(true);
    setErr("");
    setInfo("");

    try {
      const res = await fetch(
        `/api/employees/${id}/calendar?date=${encodeURIComponent(dateKey)}`,
        {
          method: "DELETE",
        }
      );

      await readJson(res);
      setInfo("Kalenderdag verwijderd.");
      closeCalendarDialog();
      await loadEmployee();
    } catch (e) {
      setErr(e?.message || "Kalenderdag verwijderen mislukt.");
    } finally {
      setSavingCalendar(false);
    }
  }

  function goToPreviousMonth() {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Rooster
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Stel hier per weekdag de vaste referentietijd in.
                      </Typography>
                    </Box>

                    <Card variant="outlined">
                      <CardContent>
                        <Stack spacing={3}>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                              gap: 1,
                            }}
                          >
                            {rosterDays.map((row) => {
                              const hasPositiveValue =
                                row.expectedMinutes !== "" &&
                                row.expectedMinutes != null &&
                                Number(row.expectedMinutes) > 0;

                              return (
                                <Box
                                  key={row.weekday}
                                  sx={{
                                    border: "1px solid",
                                    borderColor: hasPositiveValue ? "#8bc34a" : "#d9d9d9",
                                    minHeight: 180,
                                    bgcolor: hasPositiveValue ? "#dff3e3" : "#ffffff",
                                    p: 1,
                                    overflow: "hidden",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      border: "1px solid",
                                      borderColor: "#d9d9d9",
                                      bgcolor: "#f5f5f5",
                                      px: 1,
                                      py: 1,
                                      mb: 1.5,
                                      minHeight: 44,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      fontWeight={700}
                                      align="center"
                                      noWrap
                                    >
                                      {weekdayLabel(row.weekday)}
                                    </Typography>
                                  </Box>

                                  <Stack spacing={1.5}>
                                    <Typography variant="body2" color="text.secondary">
                                      Referentietijd:{" "}
                                      <strong>{minutesToHoursLabel(row.expectedMinutes)}</strong>
                                    </Typography>

                                    <TextField
                                      label="Verwachte minuten"
                                      type="number"
                                      value={row.expectedMinutes}
                                      onChange={(e) =>
                                        updateRosterMinutes(row.weekday, e.target.value)
                                      }
                                      fullWidth
                                      size="small"
                                    />

                                    <Typography variant="caption" color="text.secondary">
                                      Leeg = 0 minuten.
                                    </Typography>
                                  </Stack>
                                </Box>
                              );
                            })}
                          </Box>

                          <Box>
                            <Button
                              variant="contained"
                              onClick={saveRoster}
                              disabled={savingRoster}
                            >
                              {savingRoster ? "Opslaan..." : "Rooster opslaan"}
                            </Button>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                ) : null}

                {tab === 2 ? (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Kalender
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Klik op een dag om de referentietijd in te vullen. Voorbije dagen
                        kunnen niet aangepast worden.
                      </Typography>
                    </Box>

                    <Card variant="outlined">
                      <CardContent>
                        <Stack spacing={3}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <IconButton onClick={goToPreviousMonth}>
                              <ChevronLeftIcon />
                            </IconButton>

                            <Typography
                              variant="h5"
                              fontWeight={800}
                              sx={{ textTransform: "capitalize" }}
                            >
                              {monthTitle(calendarMonth)}
                            </Typography>

                            <IconButton onClick={goToNextMonth}>
                              <ChevronRightIcon />
                            </IconButton>
                          </Stack>

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                              gap: 1,
                            }}
                          >
                            {[
                              "Maandag",
                              "Dinsdag",
                              "Woensdag",
                              "Donderdag",
                              "Vrijdag",
                              "Zaterdag",
                              "Zondag",
                            ].map((day) => (
                              <Box
                                key={day}
                                sx={{
                                  border: "1px solid",
                                  borderColor: "#d9d9d9",
                                  bgcolor: "#f5f5f5",
                                  px: 1,
                                  py: 1,
                                  minHeight: 44,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  overflow: "hidden",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  align="center"
                                  noWrap
                                >
                                  {day}
                                </Typography>
                              </Box>
                            ))}

                            {calendarCells.map((cell, index) => {
                              if (!cell) {
                                return (
                                  <Box
                                    key={`empty-${index}`}
                                    sx={{
                                      border: "1px solid",
                                      borderColor: "#d9d9d9",
                                      minHeight: 120,
                                      bgcolor: "#d9f2ff",
                                    }}
                                  />
                                );
                              }

                              const existingMinutes = calendarMap[cell.key];
                              const hasValue = existingMinutes !== undefined;
                              const isPast = isPastDateKey(cell.key);

                              const cellBgColor = isPast
                                ? "#f7f7f7"
                                : hasValue && Number(existingMinutes) > 0
                                ? "#dff3e3"
                                : "#ffffff";

                              const cellBorderColor = isPast
                                ? "#d9d9d9"
                                : hasValue && Number(existingMinutes) > 0
                                ? "#8bc34a"
                                : "#d9d9d9";

                              return (
                                <Box
                                  key={cell.key}
                                  onClick={() => openCalendarDay(cell.key)}
                                  sx={{
                                    border: "1px solid",
                                    borderColor: cellBorderColor,
                                    minHeight: 120,
                                    p: 1,
                                    bgcolor: cellBgColor,
                                    cursor: isPast ? "default" : "pointer",
                                    opacity: 1,
                                    overflow: "hidden",
                                    "&:hover": isPast
                                      ? {}
                                      : {
                                          filter: "brightness(0.98)",
                                        },
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="flex-start"
                                    spacing={1}
                                  >
                                    <Typography
                                      variant="body2"
                                      fontWeight={800}
                                      sx={{ flexShrink: 0 }}
                                    >
                                      {cell.dayNumber}
                                    </Typography>

                                    {isPast ? (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ textAlign: "right" }}
                                      >
                                        Vergrendeld
                                      </Typography>
                                    ) : null}
                                  </Stack>

                                  <Box sx={{ mt: 1 }}>
                                    {hasValue && Number(existingMinutes) > 0 ? (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ wordBreak: "break-word" }}
                                      >
                                        Referentietijd:{" "}
                                        <strong>{minutesToHoursLabel(existingMinutes)}</strong>
                                      </Typography>
                                    ) : (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ wordBreak: "break-word" }}
                                      >
                                        Geen tijd ingesteld
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Dialog
                      open={dialogOpen}
                      onClose={closeCalendarDialog}
                      fullWidth
                      maxWidth="xs"
                    >
                      <DialogTitle>{fmtDate(selectedDateKey)}</DialogTitle>

                      <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Vul de referentietijd in minuten in.
                          </Typography>

                          <TextField
                            label="Verwachte minuten"
                            type="number"
                            value={selectedMinutes}
                            onChange={(e) => setSelectedMinutes(e.target.value)}
                            fullWidth
                          />
                        </Stack>
                      </DialogContent>

                      <DialogActions
                        sx={{ px: 3, pb: 3, justifyContent: "space-between" }}
                      >
                        <Box>
                          {selectedDateKey && calendarMap[selectedDateKey] !== undefined ? (
                            <Button
                              color="error"
                              onClick={() => deleteCalendarDay(selectedDateKey)}
                              disabled={savingCalendar}
                            >
                              Verwijderen
                            </Button>
                          ) : null}
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Button onClick={closeCalendarDialog} disabled={savingCalendar}>
                            Annuleren
                          </Button>
                          <Button
                            variant="contained"
                            onClick={saveCalendarDay}
                            disabled={savingCalendar}
                          >
                            {savingCalendar ? "Opslaan..." : "Opslaan"}
                          </Button>
                        </Stack>
                      </DialogActions>
                    </Dialog>
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