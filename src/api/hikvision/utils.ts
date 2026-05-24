import { XMLParser } from 'fast-xml-parser';

export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

export function parseHikvisionEvent(body: any) {
  // If it's already an object (JSON), return it
  if (typeof body === 'object') return body;

  // If it's a string, try to parse as XML
  try {
    return parser.parse(body);
  } catch (e) {
    console.error('Error parsing XML:', e);
    return null;
  }
}

export function extractEventDetails(rawEvent: any) {
  // Hikvision ISAPI events can be deep. This is a generic mapper.
  // Common structure for ISAPI Event: rawEvent.EventNotificationAlert
  const details = rawEvent?.EventNotificationAlert || rawEvent;
  
  return {
    deviceId: details.macAddress || details.ipAddress || 'unknown-device',
    deviceName: details.deviceName || 'Camara/Terminal',
    timestamp: details.dateTime || new Date().toISOString(),
    employeeId: details.AccessControllerEvent?.employeeNoString || null,
    employeeName: details.AccessControllerEvent?.name || null,
    eventType: details.eventType || details.eventDescription || 'General Event',
    photoUrl: details.AccessControllerEvent?.pictureURL || null,
  };
}
