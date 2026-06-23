# 主体锁定婚纱照生成提示词模板

Use case: identity-preserve / compositing / background-replacement
Asset type: production-standard commercial bridal retouch

Primary request:
Create a hyper-realistic commercial bridal photograph by preserving the real client from the original image and transforming only the environment, atmosphere, background, floral set, lighting integration, and limited wardrobe/fabric extension. This is not a full person regeneration task.

Input images:
- Original image: the real client and primary subject. Preserve the client's face, body proportions, skin tone, and real person identity.
- Reference image: conditional style reference. Always use it for background, light, color, floral design, environment mood, and composition inspiration. Use its hairstyle, wardrobe, pose, or expression only if the task options below explicitly allow it. Never copy the reference model's face, body identity, makeup identity, or personal likeness.

Scene/backdrop:
{{scene_style}}

Subject lock:
{{subject_lock}}

Reference hairstyle option:
{{reference_hairstyle_option}}

Reference wardrobe option:
{{reference_wardrobe_option}}

Pose and expression option:
{{pose_expression_option}}

Pose/body:
{{pose_requirement}}

Wardrobe/fabric:
{{wardrobe_requirement}}

Background generation:
Generate or replace the background as a real photographic scene with correct perspective, realistic depth, believable daylight/studio light, and no watermark, no logo, no text. The background must not contain another model. The background should support the client and must not look pasted behind her.

Compositing and light integration:
Keep the original client as the hero subject. Match the background light direction, color temperature, contrast, shadow softness, and lens depth. Add realistic contact shadows, edge light, environmental reflection, fabric shadow, and believable foreground/background occlusion. Avoid floating subject, cutout edges, halo edges, mismatched color, or pasted-on look.

Face and identity rules:
The face must remain the real client from the original image. Do not redraw the face. Do not change face shape, eye shape, eye spacing, nose bridge, nose tip, lips, jawline, cheekbone structure, expression identity, age, or skin tone. If the face changes, the result is rejected and must be corrected with original-face replacement.

Hairstyle and wardrobe control:
- If hairstyle option is "不参考": preserve the original hairstyle and do not copy reference hair.
- If hairstyle option is "参考风格": keep the client's hairline, hair volume, face framing, and identity; borrow only broad styling cues such as softness, veil placement, accessory mood, or updo/down-do direction.
- If hairstyle option is "匹配参考": adapt the reference hairstyle more closely, but keep the client's face, hairline, head shape, age, and identity. Do not copy the reference model's face.
- If wardrobe option is "不参考": preserve the original wardrobe structure except for realistic cleanup and fabric refinement.
- If wardrobe option is "参考风格": borrow broad wardrobe mood, fabric type, silhouette, veil, sleeve style, or bridal styling while preserving the client's body proportions and pose.
- If wardrobe option is "匹配参考": adapt the reference wardrobe more closely, but keep anatomy realistic, coverage tasteful, and the client's body proportions and pose intact.

Pose and expression control:
- If pose/expression option is "动作保持": keep the original body pose, head angle, gaze direction, and expression. Change only the background, light, styling, and limited fabric details.
- If pose/expression option is "小幅调整": keep the original identity and body proportions, but allow small adjustments to hand placement, dress flow, head tilt, gaze, and expression softness so the subject fits the new scene naturally.
- If pose/expression option is "重新设计": allow a new elegant bridal pose and expression inspired by the reference or scene, while preserving the client's face, age, body proportions, realistic anatomy, and recognizable identity. This mode requires stricter final face replacement/identity QA.

Retouching requirements:
Commercial wedding retouching. Skin should be clean, luminous, and refined while preserving real pores, natural skin texture, micro-contrast, skin depth, and realistic facial detail. No plastic skin, no waxy smoothing, no fake whitening, no AI doll face.

Output standard:
Hyper-realistic photography, real camera look, premium wedding editorial grade, client-safe commercial delivery quality.

Negative prompt:
changed face, different person, copied reference model, copied reference face, copied reference identity, copied reference body identity, face swap look, AI doll face, plastic skin, waxy skin, fake whitening, over-smoothed skin, pasted subject, cutout halo, floating body, mismatched shadows, mismatched color temperature, fake background, obvious AI look, unrealistic lighting, extra fingers, broken hands, warped legs, distorted feet, melted dress, dirty dress edges, unrealistic hair, watermark, logo, text, low resolution, cartoon, painting, illustration
