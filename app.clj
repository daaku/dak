(import ["@daaku/hashnav" :refer [Router]]
        ["@daaku/firebase-auth" :refer [Auth]]
        ["./jsx.js" :refer [JSX]]
        ["./index.css"]
        ["./parser.js" :refer [DB Item Macro Quantity quantityString
                               summarizeMacros Summary Unit]]
        ["./pie.js" :refer [Pie]])

; Janky title case.
(fn title-case [s]
  (-> s
      (.split " ")
      (.map #(%.replace (. % 0) (.toUpperCase (. % 0))))
      (.join " ")))

(fn today-path []
  "Make the path for today's plan."
  (let [d (Date.)]
    (str "#/date/" (d.getFullYear) "/" (inc (d.getMonth)) "/" (d.getDate))))

(fn site-header [ctx & children]
  "Render the top level site header."
  #[:header
    [:h1 children]
    [:nav [:ul
           [:li [:a {:href "#/"} "Home"]]
           [:li [:a {:href "#/about"} "About"]]
           [:li [:a {:href (today-path)} "Today"]]]]])

(fn render-quantity [q]
  (let [qs (quantity-string q)]
    (when-not (= qs "")
      #[:span qs])))

(fn render-pie [summary]
  (let [p (Pie. {:data [{:label "Protein"
                         :amount (or summary.macros?.protein?.amount 0)}
                        {:label "Fat"
                         :amount (or summary.macros?.fat?.amount 0)}
                        {:label "Carb"
                         :amount (or summary.macros?.carb?.amount 0)}]})]
    #[:svg {:viewBox (:viewBox pie)}
      (.map (p.paths)
            (fn [{:keys [d fill label title]}]
              #[:<>
                [:path {:d d :fill fill} [:title title]]
                [:text {:x label.x :y label.y :fill "#fff"
                        :font-size "2.5rem" :font-weight 700
                        :dominant-baseline "middle" :text-anchor "middle"}
                 title]]))]))

(fn render-missing [missing]
  (when (pos? missing.length)
    #[:<>
      [:h4 "Missing Nutrition Data"]
      [:ul (missing.map #(#[:li %]))]]))

(fn render-date [{:keys [ctx year month date]}]
  (let [date (Date. (+ year) (- month 1) (+ date))
        recipe (ctx.db.findDay date)
        summary (summarizeMacros ctx.db recipe)]
    #[:<>
      [site-header ctx "Plan for " (date.toDateString)]
      [:div
       [:div
        [:ul (recipe.items.map #(#[:li (title-case %.label)
                                   [render-quantity %.quantity]]))]
        [render-missing summary.missing]]
       [:div [render-macros summary]
        [render-pie summary]]]]))

(fn render-macros [summary]
  (fn row [label macro indent]
    (let [q (?. summary.macros (. Macro macro))]
      (if (pos? q?.amount)
        #[:tr
          [:th (if indent [:span label] label)]
          [:td (quantity-string q)]])))
  #[:table [:tbody
            [row "Calorie" :Calorie false]
            [row "Fat" :Fat false]
            [row "Saturated Fat" :SaturatedFat true]
            [row "Carb" :Carb false]
            [row "Fiber" :Fiber true]
            [row "Sugar" :Sugar true]
            [row "Protein" :Protein false]
            [row "Salt" :Salt false]
            [row "Potassium" :Potassium false]]])

(fn auth-status [ctx]
  (if-let [email ctx?.auth?.user?.email]
    #[:p "Welcome " [:strong email]]
    #[:p "Sign in for the best experience."]))

(fn home [ctx]
  #[:<>
    [site-header ctx "Home"]
    [auth-status ctx]
    [:a {:href "#/about"} "About"]
    [:a {:href (today-path)} "Today"]])

(fn about [ctx]
  (let [ref {}
        count 0
        onclick (fn []
                  (set! count (inc count))
                  (.replaceChildren (:value ref) #[:strong "BOOM: " count]))]
    #[:<>
      [site-header ctx "About"]
      [:div {:ref ref} "Click below to change me."]
      [:div [:button {:onclick onclick} "Change Me"]]
      [:div "Tell us more."]]))

(fn make-handler [component ctx]
  (let [root (document.getElementById "root")]
    #(root.replaceChildren #[component ctx %])))

(fn@ ^:export main [fs]
  (let [db (DB. fs "../data/")
        auth @(Auth.new {:apiKey __FIREBASE_API_KEY__})
        router (Router.)
        ctx {:db db :auth auth :router router}]
    (.on router "#/" (make-handler home ctx))
    (.on router "#/about" (make-handler about ctx))
    (.on router "#/date/:year/:month/:date" (make-handler render-date ctx))
    (.mount router)))
