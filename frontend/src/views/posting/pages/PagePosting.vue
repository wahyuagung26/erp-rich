<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/base/PageHeader.vue'
import Panel from '@/components/base/Panel.vue'
import Tabs from '@/components/base/Tabs.vue'
import TabPosting from '../components/TabPosting.vue'
import TabClosing from '../components/TabClosing.vue'

const tab = ref('posting')
const tabs = [
	{ label: 'Posting', value: 'posting' },
	{ label: 'Closing Bulanan', value: 'closing' }
]
</script>

<template>
	<div class="space-y-4 p-4">
		<PageHeader title="Posting" subtitle="Posting periode dan closing bulanan." />
		<Panel class="space-y-5">
			<Tabs v-model="tab" :tabs="tabs" />
			<TabPosting v-if="tab === 'posting'" />
			<TabClosing v-else />
		</Panel>
	</div>
</template>
