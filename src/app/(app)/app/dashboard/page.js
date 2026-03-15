import { prisma } from "@/lib/prisma";

function formatDate(d) {
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth()+1} - ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
}

export default async function DashboardPage() {

  const employees = await prisma.employee.findMany({
    where: { active: true },
    orderBy: { name: "asc" }
  });

  const scans = await prisma.scanEvent.findMany({
    orderBy: { scannedAt: "desc" }
  });

  const lastScanPerEmployee = {};

  scans.forEach(scan => {
    if (!lastScanPerEmployee[scan.employeeId]) {
      lastScanPerEmployee[scan.employeeId] = scan;
    }
  });

  const working = [];
  const absent = [];

  employees.forEach(emp => {
    const last = lastScanPerEmployee[emp.id];

    if (!last) {
      absent.push(emp.name);
      return;
    }

    if (last.type === "IN") {
      working.push(emp.name);
    } else {
      absent.push(emp.name);
    }
  });

  const lastIns = scans
    .filter(s => s.type === "IN")
    .map(s => {
      const emp = employees.find(e => e.id === s.employeeId);
      return `${formatDate(s.scannedAt)} - ${emp?.name || "?"}`;
    });

  const lastOuts = scans
    .filter(s => s.type === "OUT")
    .map(s => {
      const emp = employees.find(e => e.id === s.employeeId);
      return `${formatDate(s.scannedAt)} - ${emp?.name || "?"}`;
    });

  return (
    <div style={{padding:40}}>

      <h1 style={{fontSize:32,fontWeight:700,marginBottom:30}}>
        Dashboard
      </h1>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:30
      }}>

        <div style={card}>
          <h3>Aan het werk</h3>
          {working.map((w,i)=>(
            <div key={i}>{w}</div>
          ))}
        </div>

        <div style={card}>
          <h3>Afwezig</h3>
          {absent.map((w,i)=>(
            <div key={i}>{w}</div>
          ))}
        </div>

        <div style={card}>
          <h3>Laatste IN</h3>
          {lastIns.map((w,i)=>(
            <div key={i}>{w}</div>
          ))}
        </div>

        <div style={card}>
          <h3>Laatste OUT</h3>
          {lastOuts.map((w,i)=>(
            <div key={i}>{w}</div>
          ))}
        </div>

      </div>

    </div>
  );
}

const card = {
  border:"2px solid #1c3d4a",
  borderRadius:20,
  padding:20,
  minHeight:220,
  background:"#fff"
};