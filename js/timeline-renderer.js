export class TimelineRenderer {
  constructor(container, courses) {
    this.container = container;
    this.courses = courses;
    this._needle = null;
    this._cards = [];
    this._progressBar = null;
    this._dayStartMs = 0;
    this._dayEndMs = 0;
  }

  render() {
    if (this.courses.length === 0) {
      this.container.innerHTML = `
        <div class="no-classes">
          <div class="icon">🎉</div>
          <div class="message">今天没有课程安排</div>
        </div>`;
      return;
    }

    this._dayStartMs = this.courses[0].startMs;
    this._dayEndMs = this.courses[this.courses.length - 1].endMs;

    const timeline = document.createElement('div');
    timeline.className = 'timeline';

    const line = document.createElement('div');
    line.className = 'timeline__line';
    timeline.appendChild(line);

    this._needle = document.createElement('div');
    this._needle.className = 'timeline__needle';
    timeline.appendChild(this._needle);

    this.courses.forEach((course, idx) => {
      if (idx > 0) {
        const prevEnd = this.courses[idx - 1].endMs;
        const gap = course.startMs - prevEnd;
        if (gap > 0) {
          const breakEl = document.createElement('div');
          breakEl.className = 'break-indicator';
          const minutes = Math.round(gap / 60000);
          breakEl.textContent = minutes >= 60 ? `午休 ${Math.round(minutes / 60)}h` : `课间 ${minutes}min`;
          timeline.appendChild(breakEl);
        }
      }

      const card = this._createCard(course);
      timeline.appendChild(card);
      this._cards.push({ el: card, course });
    });

    this.container.innerHTML = '';
    this.container.appendChild(timeline);
  }

  _createCard(course) {
    const card = document.createElement('div');
    card.className = 'period-card glass-card';
    card.dataset.period = course.period;

    card.innerHTML = `
      <span class="period-card__period-num">第${course.period}节</span>
      <div class="period-card__header">
        <div class="period-card__subject">
          <span class="period-card__icon">${course.theme.icon}</span>
          <span class="period-card__name">${course.subject}</span>
        </div>
        <span class="period-card__room">${course.room}</span>
      </div>
      <div class="period-card__meta">
        <span class="period-card__teacher">${course.teacher}</span>
        <span class="period-card__time">${course.startTime} — ${course.endTime}</span>
      </div>
      <div class="period-card__progress" style="display:none;">
        <div class="period-card__progress-bar" style="width:0%"></div>
      </div>`;

    return card;
  }

  update(state) {
    this._updateCards(state);
    this._updateNeedle(state);
  }

  _updateCards(state) {
    this._cards.forEach(({ el, course }) => {
      el.classList.remove('period-card--past', 'period-card--active', 'period-card--future', 'glass-card--active');
      const progressContainer = el.querySelector('.period-card__progress');

      if (state.status === 'in-class' && state.currentPeriod && course.period === state.currentPeriod.period) {
        el.classList.add('period-card--active', 'glass-card--active');
        progressContainer.style.display = 'block';
        const bar = progressContainer.querySelector('.period-card__progress-bar');
        bar.style.width = `${(state.progress * 100).toFixed(1)}%`;
        this._progressBar = bar;
      } else if (state.nowMs >= course.endMs) {
        el.classList.add('period-card--past');
        progressContainer.style.display = 'none';
      } else {
        el.classList.add('period-card--future');
        progressContainer.style.display = 'none';
      }
    });
  }

  _updateNeedle(state) {
    if (!this._needle || this.courses.length === 0) return;

    const timeline = this._needle.parentElement;
    const totalHeight = timeline.scrollHeight;
    const headerHeight = 0;

    const cardEls = timeline.querySelectorAll('.period-card');
    if (cardEls.length === 0) return;

    const firstCardTop = cardEls[0].offsetTop;
    const lastCard = cardEls[cardEls.length - 1];
    const lastCardBottom = lastCard.offsetTop + lastCard.offsetHeight;
    const trackHeight = lastCardBottom - firstCardTop;

    const progress = Math.max(0, Math.min(1,
      (state.nowMs - this._dayStartMs) / (this._dayEndMs - this._dayStartMs)
    ));

    const needleTop = firstCardTop + progress * trackHeight;
    this._needle.style.top = `${needleTop}px`;

    if (state.nowMs < this._dayStartMs || state.nowMs > this._dayEndMs) {
      this._needle.style.opacity = '0';
    } else {
      this._needle.style.opacity = '1';
    }
  }

  scrollToActive() {
    const activeCard = this.container.querySelector('.period-card--active');
    if (activeCard) {
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
