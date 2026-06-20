import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { AttendanceRecord, Employee } from '../types';

export const attendanceService = {
  async getDailyAttendance(date: string, employees: Employee[]): Promise<AttendanceRecord[]> {
    try {
      // Create start and end of the given date
      const startDate = new Date(`${date}T00:00:00.000Z`);
      const endDate = new Date(`${date}T23:59:59.999Z`);

      const eventsRef = collection(db, 'hikvision_events');
      const q = query(
        eventsRef,
        where('timestamp', '>=', startDate.toISOString()),
        where('timestamp', '<=', endDate.toISOString()),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const events = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      const records: AttendanceRecord[] = [];

      employees.forEach(emp => {
        // Filter events for this employee.
        const empEvents = events.filter(e => 
          e.employeeId === emp.id || 
          e.employeeId === emp.code ||
          (e.employeeName && e.employeeName.toLowerCase().includes(emp.name.toLowerCase()))
        );

        if (empEvents.length === 0) {
          records.push({
            id: `att_${emp.id}_${date}`,
            employeeId: emp.id,
            employeeName: `${emp.name} ${emp.lastName || ''}`.trim(),
            date,
            checkIn: null,
            checkOut: null,
            status: 'AUSENTE',
            hoursWorked: 0
          });
          return;
        }

        const checkInEvent = empEvents[0];
        const checkOutEvent = empEvents.length > 1 ? empEvents[empEvents.length - 1] : null;

        const checkInTime = new Date(checkInEvent.timestamp);
        const checkOutTime = checkOutEvent ? new Date(checkOutEvent.timestamp) : null;

        let hoursWorked = 0;
        if (checkInTime && checkOutTime) {
          const diffMs = checkOutTime.getTime() - checkInTime.getTime();
          hoursWorked = diffMs / (1000 * 60 * 60);
        }

        records.push({
          id: `att_${emp.id}_${date}`,
          employeeId: emp.id,
          employeeName: `${emp.name} ${emp.lastName || ''}`.trim(),
          date,
          checkIn: checkInTime.toISOString(),
          checkOut: checkOutTime ? checkOutTime.toISOString() : null,
          status: 'PRESENTE',
          hoursWorked: parseFloat(hoursWorked.toFixed(2))
        });
      });

      return records;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return employees.map(emp => ({
        id: `att_${emp.id}_${date}`,
        employeeId: emp.id,
        employeeName: `${emp.name} ${emp.lastName || ''}`.trim(),
        date,
        checkIn: null,
        checkOut: null,
        status: 'AUSENTE',
        hoursWorked: 0
      }));
    }
  }
};
