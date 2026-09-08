

```markdown
# UI/UX Audit and Implementation Prompt: Hick's Law

## Objective
Act as an expert UI/UX engineer. Your task is to audit the provided codebase and implement refactors based on **Hick's Law**, which dictates that the more choices you give a user, the longer it takes them to make a decision [1]. More decisions lead to increased friction, which ultimately hurts user retention [1].

## Core Philosophy
One of the biggest mistakes in app design is attempting to show the user everything the product can do at once, which makes the app feel overly complicated [1]. Your goal is to ensure that while the application might be incredibly complex below the surface, the user's next action always feels completely obvious [1]. 

Keep in mind highly optimized apps as a benchmark: Uber focuses solely on picking a destination, Duolingo wants you to start the next lesson, and TikTok just wants you to keep watching [1].

## Audit Checklist (The 5 Rules)
Please review the provided components, layouts, and screens against these five rules of Hick's Law [1]:
1. **Single Primary Action:** Ensure every screen has one obvious primary action [1].
2. **Visual Hierarchy:** Make sure the primary button looks significantly more important than everything else around it [1].
3. **Progressive Disclosure:** Hide all advanced options until the user actually needs to use them [1].
4. **Button Grouping:** Verify that multiple buttons placed next to each other do not look equally important [1].
5. **Contextual Relevance:** If a setting or option isn't relevant to the current context, do not show it [1].

## Action Items for the Agent
1. **Analyze:** Scan the provided UI codebase and identify any components, screens, or navigation flows that violate the 5 rules outlined above.
2. **Report:** Provide a brief summary of the UX friction points you found (e.g., competing primary buttons, cluttered menus).
3. **Refactor:** Rewrite the code to simplify the interface. Clearly isolate primary actions, demote secondary actions visually, and tuck advanced options behind contextual menus or progressive steps.
```