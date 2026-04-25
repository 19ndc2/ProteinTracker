# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]: 💪
      - generic [ref=e8]: Protein Tracker
    - generic [ref=e9]:
      - link "History" [ref=e10] [cursor=pointer]:
        - /url: /history
      - generic [ref=e11]: Meal E2E Tester
      - button "Log out" [ref=e12] [cursor=pointer]
  - main [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e15]:
        - img "Daily protein progress" [ref=e16]
        - generic [ref=e19]:
          - generic [ref=e20]: "0"
          - text: / 150g
        - paragraph [ref=e21]: 0% of daily goal
      - generic [ref=e24]:
        - heading "Log a Meal" [level=3] [ref=e25]
        - generic [ref=e26]:
          - button "🎙" [ref=e27] [cursor=pointer]
          - textbox "e.g. 2 chicken breasts yesterday" [ref=e28]: 3 eggs
          - button "Estimate" [ref=e29] [cursor=pointer]
        - paragraph [ref=e30]: Could not estimate protein. Please try again.
    - paragraph [ref=e32]: No meals logged today. Log your first meal above.
```