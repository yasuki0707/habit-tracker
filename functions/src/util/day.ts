import * as dayjs from 'dayjs';

export class DayjsDate extends Date {
  format = (format: string) =>
    format
      .replace('YYYY', dayjs(this).format('YYYY'))
      .replace('MM', dayjs(this).format('MM'))
      .replace('DD', dayjs(this).format('DD'))
      .replace('HH', dayjs(this).format('HH'))
      .replace('mm', dayjs(this).format('mm'))
      .replace('ss', dayjs(this).format('ss'));

  dayBefore = (day: number) => new DayjsDate(dayjs(this).subtract(day, 'day').toDate());

  jt = () => {
    return new DayjsDate(dayjs(this).add(9, 'hour').toDate());
  };
}
