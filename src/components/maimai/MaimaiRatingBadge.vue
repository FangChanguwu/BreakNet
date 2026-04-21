<template>
  <img
    v-if="imageSrc"
    :src="imageSrc"
    :alt="`rating ${normalizedRating}`"
    class="rating-badge"
    :class="{ 'rating-badge-summary': summary }"
    draggable="false"
  />
  <span v-else class="rating-fallback">{{ normalizedRating }}</span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps<{
  rating?: number | null;
  summary?: boolean;
}>();

const imageSrc = ref("");

const normalizedRating = computed(() => Math.max(0, Number(props.rating || 0)));

const layout = computed(() =>
  props.summary
    ? {
        width: 186,
        height: 37,
        digitsLeft: 84,
        digitWidth: 15,
        digitHeight: 17,
        starHeight: 33,
      }
    : {
        width: 170,
        height: 33,
        digitsLeft: 77,
        digitWidth: 14,
        digitHeight: 15.8,
        starHeight: 30,
      },
);

const getRatingTier = (ratingValue: number) => {
  if (ratingValue < 1000) return { frame: "01", star: 0 };
  if (ratingValue < 2000) return { frame: "02", star: 0 };
  if (ratingValue < 4000) return { frame: "03", star: 0 };
  if (ratingValue < 7000) return { frame: "04", star: 0 };
  if (ratingValue < 10000) return { frame: "05", star: 0 };
  if (ratingValue < 12000) return { frame: "06", star: 0 };
  if (ratingValue < 13000) return { frame: "07", star: 0 };
  if (ratingValue < 14000) return { frame: "08", star: 0 };
  if (ratingValue < 14500) return { frame: "09", star: ratingValue < 14250 ? 1 : 2 };
  if (ratingValue < 15000) return { frame: "10", star: ratingValue < 14750 ? 1 : 2 };
  if (ratingValue < 16000) {
    if (ratingValue < 15250) return { frame: "11", star: 1 };
    if (ratingValue < 15500) return { frame: "11", star: 2 };
    if (ratingValue < 15750) return { frame: "11", star: 3 };
    return { frame: "11", star: 4 };
  }
  if (ratingValue < 16250) return { frame: "12", star: 1 };
  if (ratingValue < 16500) return { frame: "12", star: 2 };
  if (ratingValue < 16750) return { frame: "12", star: 3 };
  return { frame: "12", star: 4 };
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });

const drawBadge = async () => {
  const ratingValue = normalizedRating.value;
  const { frame, star } = getRatingTier(ratingValue);
  const digits = String(Math.trunc(ratingValue)).padStart(5, "0").slice(-5).split("");
  const { width, height, digitsLeft, digitWidth, digitHeight, starHeight } = layout.value;

  try {
    const frameImage = await loadImage(`/maimai/rating/UI_CMN_DXRating_${frame}.png`);
    const digitImages = await Promise.all(
      digits.map(digit => loadImage(`/maimai/rating/UI_NUM_Drating_${digit}.png`)),
    );
    const starImage = star
      ? await loadImage(`/maimai/rating/UI_CMN_DXRating_Star_${String(star).padStart(2, "0")}.png`)
      : null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.drawImage(frameImage, 0, 0, width, height);

    const digitsWidth = digitImages.length * digitWidth;
    const digitsTop = (height - digitHeight) / 2;
    let currentLeft = digitsLeft;

    if (starImage) {
      const starWidth = (starImage.width / starImage.height) * starHeight;
      context.drawImage(starImage, width - starWidth, (height - starHeight) / 2, starWidth, starHeight);
    }

    if (currentLeft + digitsWidth > width - 18) {
      currentLeft = width - 18 - digitsWidth;
    }

    digitImages.forEach(image => {
      context.drawImage(image, currentLeft, digitsTop, digitWidth, digitHeight);
      currentLeft += digitWidth;
    });

    imageSrc.value = canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Draw rating badge failed:", error);
    imageSrc.value = "";
  }
};

watch(() => [props.rating, props.summary], drawBadge, { immediate: true });
onMounted(drawBadge);
</script>

<style scoped>
.rating-badge {
  display: block;
  width: 170px;
  height: 33px;
  user-select: none;
}

.rating-badge-summary {
  width: 186px;
  height: 37px;
}

.rating-fallback {
  display: inline-flex;
  min-width: 56px;
  justify-content: center;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  font-weight: 800;
}

[data-theme="dark"] .rating-fallback {
  background: rgba(29, 78, 216, 0.24);
  color: #93c5fd;
}
</style>
