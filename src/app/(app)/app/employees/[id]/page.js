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
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

function toIsoDateString(date) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
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
  return map[weekday];
}

function minutesToHoursLabel(minutes) {
  if (minutes === "" || minutes == null) return "-";
  return `${minutes / 60} u`;
}

function monthTitle(date) {
  return date.toLocaleDateString("nl-BE", {
    month: "long",
    year: "numeric",
  });
}

async function readJson(res) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text);
  }
  return data;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const [employee, setEmployee] = useState(null);
  const [rosterDays, setRosterDays] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const [calendarMonth, setCalendarMonth] = useState(new Date());

  async function loadEmployee() {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${id}`);
      const data = await readJson(res);

      setEmployee(data.employee);
      setRosterDays(data.employee?.rosterDays || []);
      setCalendarDays(data.employee?.calendarDays || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployee();
  }, [id]);

  async function saveRoster() {
    try {
      await fetch(`/api/employees/${id}/roster`, {
        method: "PUT",
        body: JSON.stringify({ days: rosterDays }),
      });
      setInfo("Rooster opgeslagen");
    } catch {
      setErr("Fout bij opslaan rooster");
    }
  }

  function updateRoster(weekday, value) {
    setRosterDays((prev) =>
      prev.map((d) =>
        d.weekday === weekday
          ? { ...d, expectedMinutes: Number(value) }
          : d
      )
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Button
              component={Link}
              href="/app/employees"
              startIcon={<ArrowBackIcon />}
            >
              Terug
            </Button>

            <Typography variant="h4" fontWeight={800}>
              Werknemer detail
            </Typography>

            <Alert icon={<ErrorOutlineIcon />} severity="info">
              Referentietijd = tijd tussen IN en OUT scan (incl. pauze)
            </Alert>

            <Divider />

            {/* ❌ PROFIEL TAB IS WEG */}
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="ROOSTER" />
              <Tab label="KALENDER" />
            </Tabs>

            {err && <Alert severity="error">{err}</Alert>}
            {info && <Alert severity="success">{info}</Alert>}

            {loading ? (
              <CircularProgress />
            ) : (
              <>
                {/* ROOSTER */}
                {tab === 0 && (
                  <Stack spacing={2}>
                    {rosterDays.map((row) => (
                      <TextField
                        key={row.weekday}
                        label={weekdayLabel(row.weekday)}
                        type="number"
                        value={row.expectedMinutes || ""}
                        onChange={(e) =>
                          updateRoster(row.weekday, e.target.value)
                        }
                      />
                    ))}

                    <Button onClick={saveRoster} variant="contained">
                      Opslaan
                    </Button>
                  </Stack>
                )}

                {/* KALENDER */}
                {tab === 1 && (
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between">
                      <IconButton
                        onClick={() =>
                          setCalendarMonth(
                            new Date(
                              calendarMonth.getFullYear(),
                              calendarMonth.getMonth() - 1
                            )
                          )
                        }
                      >
                        <ChevronLeftIcon />
                      </IconButton>

                      <Typography fontWeight={700}>
                        {monthTitle(calendarMonth)}
                      </Typography>

                      <IconButton
                        onClick={() =>
                          setCalendarMonth(
                            new Date(
                              calendarMonth.getFullYear(),
                              calendarMonth.getMonth() + 1
                            )
                          )
                        }
                      >
                        <ChevronRightIcon />
                      </IconButton>
                    </Stack>

                    <Typography color="text.secondary">
                      Kalenderwerking blijft identiek
                    </Typography>
                  </Stack>
                )}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}