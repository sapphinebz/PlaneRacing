import {
  concatMap,
  finalize,
  fromEvent,
  map,
  Observable,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from "rxjs";

class PlaneComponent extends HTMLElement {
  destroy$ = new Subject<void>();
  get planeElement(): HTMLImageElement {
    return this.shadowRoot.querySelector(`img[data-plane]`);
  }

  get positionElement(): HTMLDivElement {
    return this.shadowRoot.querySelector("div[data-position]");
  }

  originY: number;
  originX: number;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
        <style>
        [data-plane] {
          transition: transform 0.2s ease 0s;
        }
        [data-position] {
          transition: transform 1s ease 0s;
        }
        </style>
        <div data-position style="width: fit-content">
        <img data-plane src="/assets/images/plane.png" alt="plane" width="100" >
        </div>
       `;
  }
  connectedCallback() {
    fromEvent<MouseEvent>(document, "click")
      .pipe(
        tap((event) => {
          if (!this.originX && !this.originY) {
            const clientRect = this.planeElement.getBoundingClientRect();
            this.originX = Math.ceil(clientRect.x + clientRect.width / 2);
            this.originY = Math.ceil(clientRect.y + clientRect.height / 2);
          }
        }),
        map((event) => {
          const pointerLocationElement = document.createElement(
            "app-pointer-location"
          );
          pointerLocationElement.setAttribute("location_x", `${event.clientX}`);
          pointerLocationElement.setAttribute("location_y", `${event.clientY}`);
          document.body.appendChild(pointerLocationElement);
          return { event, pointerLocationElement };
        }),
        concatMap(({ event, pointerLocationElement }) => {
          return this.rotate$(event).pipe(
            switchMap((event) =>
              this.move$(event).pipe(
                finalize(() => pointerLocationElement.remove())
              )
            )
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  calcAngleDegrees(x: number, y: number) {
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  move$(event: MouseEvent) {
    return new Observable<MouseEvent>((observer) => {
      const diffX = event.clientX - this.originX;
      const diffY = event.clientY - this.originY;
      this.positionElement.style.transform = `translate(${diffX}px, ${diffY}px)`;
      const timeoutIndex = setTimeout(() => {
        observer.next(event);
        observer.complete();
      }, 1000);
      return () => clearTimeout(timeoutIndex);
    });
  }

  rotate$(event: MouseEvent) {
    return new Observable<MouseEvent>((observer) => {
      const clientRect = this.planeElement.getBoundingClientRect();
      const planeX = clientRect.x + clientRect.width / 2;
      const planeY = clientRect.y + clientRect.height / 2;

      const diffX = event.clientX - planeX;
      const diffY = event.clientY - planeY;

      const calAngle = this.calcAngleDegrees(diffX, diffY);
      let angle = Math.ceil(calAngle) + 45;
      if (angle < 0) {
        angle = 360 - Math.abs(angle);
      }
      this.planeElement.style.transform = `rotate(${angle}deg)`;
      const timeoutIndex = setTimeout(() => {
        observer.next(event);
        observer.complete();
      }, 200);
      return () => clearTimeout(timeoutIndex);
    });
  }

  disconnectedCallback() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  attributeChangedCallback(attrName: string, oldVal: any, newVal: any) {}
}

customElements.define("app-plane", PlaneComponent);

export default PlaneComponent;
