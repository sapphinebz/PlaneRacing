import {
  concatMap,
  filter,
  finalize,
  fromEvent,
  map,
  mapTo,
  merge,
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
    merge(
      this.onKeyboard("ArrowUp"),
      this.onKeyboard("ArrowDown"),
      this.onKeyboard("ArrowLeft"),
      this.onKeyboard("ArrowRight")
    )
      .pipe(
        switchMap((keyName) => {
          return new Observable((observer) => {
            let angle = 0;
            switch (keyName) {
              case "ArrowUp":
                angle = -90;
                break;
              case "ArrowDown":
                angle = 90;
                break;
              case "ArrowLeft":
                angle = 180;
                break;
              case "ArrowRight":
                angle = 0;
                break;
            }
            angle += 45;
            this.planeElement.style.transform = `rotate(${angle}deg)`;
            const index = setTimeout(() => {
              observer.next(keyName);
              observer.complete();
            }, 200);
            return () => clearTimeout(index);
          });
        })
      )
      .subscribe((keyName) => {
        const clientRect = this.planeElement.getBoundingClientRect();
        let planeX = clientRect.x + clientRect.width / 2 - this.originX;
        let planeY = clientRect.y + clientRect.height / 2 - this.originY;
        switch (keyName) {
          case "ArrowUp":
            planeY -= 100;
            break;
          case "ArrowDown":
            planeY += 100;
            break;
          case "ArrowLeft":
            planeX -= 100;
            break;
          case "ArrowRight":
            planeX += 100;
            break;
        }
        this.positionElement.style.transform = `translate(${planeX}px, ${planeY}px)`;
      });

    fromEvent<MouseEvent>(document, "click")
      .pipe(
        this.rememberOrigin(),
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
          return this.rotate$({
            clientX: event.clientX,
            clientY: event.clientY,
          }).pipe(
            switchMap(() =>
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

  rememberOrigin() {
    return (source: Observable<any>) =>
      source.pipe(
        tap((event) => {
          if (!this.originX && !this.originY) {
            const clientRect = this.planeElement.getBoundingClientRect();
            this.originX = Math.ceil(clientRect.x + clientRect.width / 2);
            this.originY = Math.ceil(clientRect.y + clientRect.height / 2);
          }
        })
      );
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

  rotate$(axis: { clientX: number; clientY: number }) {
    return new Observable<void>((observer) => {
      const clientRect = this.planeElement.getBoundingClientRect();
      const planeX = clientRect.x + clientRect.width / 2;
      const planeY = clientRect.y + clientRect.height / 2;

      const diffX = axis.clientX - planeX;
      const diffY = axis.clientY - planeY;

      const calAngle = this.calcAngleDegrees(diffX, diffY);
      let angle = Math.ceil(calAngle) + 45;
      if (angle < 0) {
        angle = 360 - Math.abs(angle);
      }
      this.planeElement.style.transform = `rotate(${angle}deg)`;
      const timeoutIndex = setTimeout(() => {
        observer.next();
        observer.complete();
      }, 200);
      return () => clearTimeout(timeoutIndex);
    });
  }

  onKeyboard(key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight") {
    return fromEvent<KeyboardEvent>(document, "keydown").pipe(
      tap((event) => {
        event.preventDefault();
      }),
      filter((event) => event.key === key),
      mapTo(key)
    );
  }

  disconnectedCallback() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  attributeChangedCallback(attrName: string, oldVal: any, newVal: any) {}
}

customElements.define("app-plane", PlaneComponent);

export default PlaneComponent;
