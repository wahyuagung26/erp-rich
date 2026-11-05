<script setup lang="ts">
// Approval status of any document (journal, cash advance, PO, purchase invoice…): one label + colour mapping
// (utils/approval.ts) and never wraps onto two lines. Extra attrs (class, title…) fall through to the badge.
import Badge from '@/components/base/Badge.vue'
import { approvalLabel, approvalTone, type ApprovalStatus } from '@/utils/approval'

defineProps<{ status: ApprovalStatus }>()
</script>

<template>
	<Badge class="whitespace-nowrap" :tone="approvalTone[status]">{{ approvalLabel[status] ?? status }}</Badge>
</template>
