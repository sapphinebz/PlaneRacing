customElements.define(
  "app-component",
  class extends HTMLElement {
    constructor() {
      super();
      this.innerHTML = `
      <app-plane></app-plane>
     `;
    }
    connectedCallback() {
      console.log("init");
    }

    disconnectedCallback() {
      console.log("destroy");
    }

    attributeChangedCallback(attrName: string, oldVal: any, newVal: any) {}
  }
);
