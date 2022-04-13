<template lang="pug">
.home
  p Loaded {{ Object.keys(modules).length }} modules
  ul
    li(v-for="x in modules")
      router-link(:to="`/module/${encodeURIComponent(x.id)}`") {{ x.id }}
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src
import { useStore } from "vuex";
import { AppStore } from "@/store";

export default defineComponent({
  name: "HomeView",
  components: {
    HelloWorld,
  },
  setup() {
    const store = useStore<AppStore>();

    return {
      modules: computed(() => store.state.modules),
      refresh: () => store.dispatch("refreshModules"),
    };
  },
  mounted() {
    if (this.modules.length == 0) {
      this.refresh();
    }
  },
});
</script>
