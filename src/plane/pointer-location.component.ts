class PointerLocationComponent extends HTMLElement {
  static get observedAttributes() {
    return ["location_x", "location_y"];
  }

  get rippleElemenet(): HTMLDivElement {
    return this.shadowRoot.querySelector("[data-ripple]");
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
        <style>
        .lds-ripple {
            display: inline-block;
            position: relative;
            width: 80px;
            height: 80px;
          }
          .lds-ripple div {
            position: absolute;
            border: 4px solid #5693d9;
            opacity: 1;
            border-radius: 50%;
            animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
          }
          .lds-ripple div:nth-child(2) {
            animation-delay: -0.5s;
          }
          @keyframes lds-ripple {
            0% {
              top: 36px;
              left: 36px;
              width: 0;
              height: 0;
              opacity: 1;
            }
            100% {
              top: 0px;
              left: 0px;
              width: 72px;
              height: 72px;
              opacity: 0;
            }
          }
          
        </style>
        <div data-ripple class="lds-ripple"><div></div><div></div></div>
       `;
  }

  connectedCallback() {
    this.style.position = "fixed";
  }

  disconnectedCallback() {}

  attributeChangedCallback(attrName: string, oldVal: any, newVal: any) {
    if (attrName === "location_x") {
      this.style.left = `${newVal - 40}px`;
    }
    if (attrName === "location_y") {
      this.style.top = `${newVal - 40}px`;
    }
  }
}

customElements.define("app-pointer-location", PointerLocationComponent);

export default PointerLocationComponent;
