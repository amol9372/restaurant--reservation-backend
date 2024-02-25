import addMinutes from "date-fns/addMinutes";
import subMinutes from "date-fns/subMinutes";
import format from "date-fns/format";

export class ReservationUtils {
  static pplMap = new Map();
  static restaurantSlots = [
    // 24 hr
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
  ];

  static {
    this.pplMap.set(4, "group-4");
    this.pplMap.set(6, "group-6");
    this.pplMap.set(8, "group-8");
  }

  static getValue(key) {
    return this.pplMap.get(key);
  }

  static addTime(time, minToAdd) {
    const [hours, minutes] = time.split(":").map(Number);
    const slot = new Date(0, 0, 0, hours, minutes);
    return format(addMinutes(slot, minToAdd), "HH:mm");
  }

  static subtractTime(time, minToSubtract) {
    const [hours, minutes] = time.split(":").map(Number);
    const slot = new Date(0, 0, 0, hours, minutes);
    return format(minToMinus(slot, minToSubtract), "HH:mm");
  }

  static getDayOfWeek() {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const date = new Date();
    const dayName = days[date.getDay()];
    return dayName;
  }

  static getTimeSlot(slots, input) {
    return slots.find((slot) => {
      const start = slot.split("-")[0];
      const end = slot.split("-")[1];
      return input >= start && input < end;
      // if (input >= start && input < end) {
      //   console.log("lies in slot", start, end);
      //   return { start, end };
      // }
    });
  }
}
