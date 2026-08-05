<script setup lang="ts">
import { messageInputSchema } from '@portfolio/shared'

type Status = 'idle' | 'pending' | 'sent'

const status = ref<Status>('idle')
const errors = ref<Record<string, string>>({})
const submitError = ref('')

const form = reactive({ name: '', email: '', message: '', website: '' })

async function onSubmit() {
  errors.value = {}
  submitError.value = ''

  // The same schema that validates the request on the server: the two can
  // never disagree.
  const parsed = messageInputSchema.safeParse(form)

  if (!parsed.success) {
    errors.value = Object.fromEntries(
      parsed.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
    )
    return
  }

  status.value = 'pending'

  try {
    await $fetch('/api/contact', { method: 'POST', body: parsed.data })
    status.value = 'sent'
  } catch {
    status.value = 'idle'
    submitError.value = 'Could not send the message. Please try again or email me directly.'
  }
}
</script>

<template>
  <div
    v-if="status === 'sent'"
    class="card sent-card"
    role="status"
    aria-live="polite"
  >
    <p class="sent-text">Thank you! Your message has been sent — I will reply shortly.</p>
  </div>

  <form v-else class="contact-form" novalidate @submit.prevent="onSubmit">
    <div class="field">
      <label for="f-name">Name</label>
      <input
        id="f-name"
        v-model="form.name"
        class="input"
        type="text"
        name="name"
        placeholder="What should I call you?"
        autocomplete="name"
        required
        :aria-invalid="Boolean(errors.name)"
        :aria-describedby="errors.name ? 'e-name' : undefined"
      >
      <p v-if="errors.name" id="e-name" class="field-error">{{ errors.name }}</p>
    </div>

    <div class="field">
      <label for="f-email">Email</label>
      <input
        id="f-email"
        v-model="form.email"
        class="input"
        type="email"
        name="email"
        placeholder="you@example.com"
        autocomplete="email"
        required
        :aria-invalid="Boolean(errors.email)"
        :aria-describedby="errors.email ? 'e-email' : undefined"
      >
      <p v-if="errors.email" id="e-email" class="field-error">{{ errors.email }}</p>
    </div>

    <div class="field">
      <label for="f-message">Message</label>
      <textarea
        id="f-message"
        v-model="form.message"
        class="input"
        name="message"
        placeholder="What would you like to talk about?"
        required
        :aria-invalid="Boolean(errors.message)"
        :aria-describedby="errors.message ? 'e-message' : undefined"
      />
      <p v-if="errors.message" id="e-message" class="field-error">{{ errors.message }}</p>
    </div>

    <!-- Honeypot: a human never sees this field. A filled one marks a bot;
         the server answers as if the send succeeded and stores nothing. -->
    <div class="honeypot" aria-hidden="true">
      <label for="f-website">Leave this field empty</label>
      <input id="f-website" v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off">
    </div>

    <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>

    <button type="submit" class="btn btn-primary submit" :disabled="status === 'pending'">
      {{ status === 'pending' ? 'Sending…' : 'Send' }}
    </button>
  </form>
</template>

<style scoped>
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 520px;
}

.submit {
  align-self: flex-start;
}

.sent-card {
  padding: 24px;
  border: 1px solid var(--color-neutral-700);
  background: var(--color-neutral-900);
  border-radius: var(--radius-lg);
}

.sent-text {
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
}

/* Errors use a light step of the accent ramp: the accent itself does not
   carry enough contrast on this ground for paragraph-size text. */
.field-error,
.submit-error {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--color-accent-300);
}

.submit-error {
  margin: 0;
}
</style>
