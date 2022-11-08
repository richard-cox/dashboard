export default {

  data() {
    return {
      history:      [],
      previousTime: null,
      MB:           1024
    };
  },

  methods: {

    printMemory2(label) {
      console.warn('label'.window.performance.measure());
    },

    async printMemory(title) {
      await performance.measureUserAgentSpecificMemory()
        .then((obj) => {
          const memoryMB = obj.bytes / this.MB;
          const now = Date.now();

          console.log(title, memoryMB.toFixed(3), now - this.previousTime);
          history.push([title, memoryMB]);
          this.previousTime = now;
        });
    },

    async test(label, workloadFn) {
      this.printMemory2(`Before: ${ label }`);

      await workloadFn();

      this.printMemory2(`After: ${ label }`);
    }
  },

};
