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
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";

function toIsoDateString(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

function weekdayLabel(w) {
  return ["", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"][w];
}

function minutesToHoursLabel(m) {
  if (m === "" || m == null) return "-";
  return `${m / 60} u`;
}

function getTodayKey() {
  return toIsoDateString(new Date());
}

function isPastDateKey(d) {
  return d < getTodayKey();
}

function getMonthGrid(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const offset = (first.getDay() + 6) % 7;
  const total = last.getDate();

  const cells = [];

  for (let i = 0; i < offset; i++) cells.push(null);

  for (let d = 1; d <= total; d++) {
    const dt = new Date(year, month, d);
    cells.push({
      key: toIsoDateString(dt),
      dayNumber: d,
    });
  }

  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export default function Page() {
  const { id } = useParams();

  const [tab, setTab] = useState(0);
  const [rosterDays, setRosterDays] = useState(
    [1,2,3,4,5,6,7].map(w => ({ weekday: w, expectedMinutes: "" }))
  );

  const [calendarDraftMap, setCalendarDraftMap] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const calendarCells = useMemo(() => getMonthGrid(calendarMonth), [calendarMonth]);

  function updateRoster(weekday, value) {
    setRosterDays(prev =>
      prev.map(r =>
        r.weekday === weekday
          ? { ...r, expectedMinutes: value === "" ? "" : Number(value) }
          : r
      )
    );
  }

  function updateCalendar(date, value) {
    setCalendarDraftMap(prev => ({ ...prev, [date]: value }));
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={3}>

            {/* HEADER */}
            <Stack direction="row" spacing={2}>
              <Button component={Link} href="/app/employees" startIcon={<ArrowBackIcon />}>
                Terug
              </Button>

              <Box>
                <Typography variant="h4" fontWeight={800}>
                  Werknemer detail
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Kies hieronder hoe je de referentieduur wil instellen.
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Ga vervolgens naar ROOSTER of KALENDER om de referentietijd (in minuten) in te vullen.
                </Typography>

                {/* 🔥 NIEUWE UX BOX */}
                <Alert
                  icon={<LightbulbOutlinedIcon />}
                  severity="info"
                  sx={{ mt: 1, alignItems: "flex-start" }}
                >
                  <Typography variant="body2" fontWeight={700}>
                    Algemene regel
                  </Typography>
                  <Typography variant="body2">
                    Referentietijd is de verwachte tijd tussen de IN- en OUT-scan.
                    De eventuele pauze valt hierin. Voorbeeld: 8 u met 30 minuten pauze = 510 minuten referentietijd.
                  </Typography>
                </Alert>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Een leeg vak wordt automatisch gelijkgesteld aan 0 minuten. Invullen mag dus,
                  maar is niet verplicht. Zodra je bewust invult, wordt het vak groen.
                </Typography>
              </Box>
            </Stack>

            <Divider />

            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="PROFIEL" />
              <Tab label="ROOSTER" />
              <Tab label="KALENDER" />
            </Tabs>

            {/* ROOSTER */}
            {tab === 1 && (
              <Stack spacing={2}>

                <Alert icon={<LightbulbOutlinedIcon />} severity="info">
                  <Typography variant="body2" fontWeight={700}>Tip</Typography>
                  <Typography variant="body2">
                    Occasionele wissel van werkdag? Geen probleem. Overtijd en ondertijd heffen elkaar automatisch op.
                  </Typography>
                </Alert>

                <Box display="grid" gridTemplateColumns="repeat(7,1fr)" gap={1}>
                  {rosterDays.map(r => {
                    const isFilled = r.expectedMinutes !== "" && r.expectedMinutes != null;

                    return (
                      <Box
                        key={r.weekday}
                        sx={{
                          border: "1px solid",
                          borderColor: isFilled ? "#8bc34a" : "#d9d9d9",
                          bgcolor: isFilled ? "#dff3e3" : "#fff",
                          p: 1
                        }}
                      >
                        <Typography fontWeight={700}>{weekdayLabel(r.weekday)}</Typography>

                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={r.expectedMinutes}
                          onChange={(e)=>updateRoster(r.weekday, e.target.value)}
                        />

                        <Typography variant="caption">
                          Referentietijd: {minutesToHoursLabel(r.expectedMinutes)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

              </Stack>
            )}

            {/* KALENDER */}
            {tab === 2 && (
              <Box display="grid" gridTemplateColumns="repeat(7,1fr)" gap={1}>
                {calendarCells.map((cell,i)=>{
                  if(!cell){
                    return <Box key={i} sx={{bgcolor:"#d9f2ff",height:120}}/>
                  }

                  const draft = calendarDraftMap[cell.key] ?? "";
                  const isFilled = draft !== "";
                  const isPast = isPastDateKey(cell.key);

                  return (
                    <Box
                      key={cell.key}
                      sx={{
                        border:"1px solid",
                        borderColor:isFilled ? "#8bc34a":"#d9d9d9",
                        bgcolor:isPast ? "#f7f7f7" : isFilled ? "#dff3e3":"#fff",
                        p:1
                      }}
                    >
                      <Typography fontWeight={700}>{cell.dayNumber}</Typography>

                      {!isPast && (
                        <TextField
                          size="small"
                          type="number"
                          fullWidth
                          value={draft}
                          onChange={(e)=>updateCalendar(cell.key,e.target.value)}
                        />
                      )}

                      <Typography variant="caption">
                        Leeg = 0 min
                      </Typography>
                    </Box>
                  )
                })}
              </Box>
            )}

          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}