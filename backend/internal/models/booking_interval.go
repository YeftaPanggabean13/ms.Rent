package models

import (
	"strconv"
	"strings"
	"time"
)

const (
	dateLayout = "2006-01-02"
	timeLayout = "15:04"
)

// durationFromHHMM mengubah string "HH:MM" menjadi time.Duration.
// String kosong dianggap 0 jam; "24:00" menghasilkan 24 jam.
func durationFromHHMM(s string) time.Duration {
	if s == "" {
		return 0
	}
	hourStr, minStr, found := strings.Cut(s, ":")
	h, err := strconv.Atoi(hourStr)
	if err != nil {
		return 0
	}
	m := 0
	if found {
		if m, err = strconv.Atoi(minStr); err != nil {
			return 0
		}
	}
	return time.Duration(h)*time.Hour + time.Duration(m)*time.Minute
}

// IntervalStart mengembalikan waktu mulai sewa (StartDate + StartTime).
// Diparse pada zona lokal agar bisa dibandingkan dengan time.Now().
func (b *Booking) IntervalStart() time.Time {
	t, err := time.ParseInLocation(dateLayout, b.StartDate, time.Local)
	if err != nil {
		return time.Time{}
	}
	return t.Add(durationFromHHMM(b.StartTime))
}

// IntervalEnd mengembalikan waktu selesai sewa (EndDate + EndTime).
// EndTime kosong dianggap 24:00 (akhir hari EndDate) untuk kompatibilitas data lama.
func (b *Booking) IntervalEnd() time.Time {
	t, err := time.ParseInLocation(dateLayout, b.EndDate, time.Local)
	if err != nil {
		return time.Time{}
	}
	if b.EndTime == "" {
		return t.Add(24 * time.Hour)
	}
	return t.Add(durationFromHHMM(b.EndTime))
}

// DurationMinutes menghitung durasi sewa dalam menit.
func (b *Booking) DurationMinutes() int {
	start, end := b.IntervalStart(), b.IntervalEnd()
	if start.IsZero() || end.IsZero() {
		return 0
	}
	return int(end.Sub(start).Minutes())
}

// AddHours menambah n jam ke waktu selesai sewa lalu menormalisasi EndDate/EndTime
// sehingga EndTime selalu berada di rentang 00:00 - 24:00 (boleh lintas tengah malam).
func (b *Booking) AddHours(n int) {
	instant := b.IntervalEnd()
	if instant.IsZero() || n == 0 {
		return
	}
	instant = instant.Add(time.Duration(n) * time.Hour)
	if hour, min, _ := instant.Clock(); hour == 0 && min == 0 {
		b.EndDate = instant.AddDate(0, 0, -1).Format(dateLayout)
		b.EndTime = "24:00"
	} else {
		b.EndDate = instant.Format(dateLayout)
		b.EndTime = instant.Format(timeLayout)
	}
}

// Overlaps memeriksa apakah dua booking saling menimpa (interval setengah terbuka).
func Overlaps(a, b *Booking) bool {
	startA, endA := a.IntervalStart(), a.IntervalEnd()
	startB, endB := b.IntervalStart(), b.IntervalEnd()
	if startA.IsZero() || endA.IsZero() || startB.IsZero() || endB.IsZero() {
		return false
	}
	return startA.Before(endB) && startB.Before(endA)
}
