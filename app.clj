(import ["@daaku/hashnav" :refer [Router]]
        ["@daaku/firebase-auth" :refer [Auth]]
        ["./jsx.js" :refer [JSX]]
        ["./index.css"]
        ["./parser.js" :refer [DB Item Macro Quantity quantityString
                               summarizeMacros Summary Unit]]
        ["./pie.js" :refer [Pie]])

(defn- title-case [s]
  (-> s
      (.split " ")
      (.map (fn [w] (.replace w (. w 0) (.toUpperCase (. w 0)))))
      (.join " ")))

(defn- today-path []
  (let [d (Date.)]
    (str "#/date/" (.getFullYear d) "/" (inc (.getMonth d)) "/" (.getDate d))))

(defn- site-header [ctx & children]
  #[:header
    [:h1 children]
    [:nav
     [:ul
      [:li [:a {:href "#/"} "Home"]]
      [:li [:a {:href "#/about"} "About"]]
      [:li [:a {:href (today-path)} "Today"]]]]])

(defn- render-quantity [q]
  (let [q (quantity-string q)]
    (when-not (= q "")
      #[:span q])))

(defn- render-pie [summary]
  (let [p (Pie. {:data [{:label "Protein"
                         :amount (or (?. summary :macros :protein :amount) 0)}
                        {:label "Fat"
                         :amount (or (?. summary :macros :fat :amount) 0)}
                        {:label "Carb"
                         :amount (or (?. summary :macros :carb :amount) 0)}]})]
    #[:svg {:viewBox (:viewBox pie)}
      (map (fn [{:keys [d fill label title]}]
             #[:<>
               [:path {:d d :fill fill} [:title title]]
               [:text {:x (:x label) :y (:y label) :fill "#fff"
                       :font-size "2.5rem" :font-weight 700
                       :dominant-baseline "middle" :text-anchor "middle"}
                title]])
           (.paths p))]))

(defn- render-missing [missing]
  (when (pos? (:length missing))
    #[:<>
      [:h4 "Missing Nutrition Data"]
      [:ul (map #([:li %]) missing)]]))

(defn- render-date [{:keys [ctx year month date]}]
  (let [date (Date. (+ year) (- month 1) (+ date))
        recipe (.findDay (:db ctx) date)
        summary (summarizeMacros (:db ctx) recipe)]
    #[:<>
      [site-header ctx "Plan for " (.toDateString date)]
      [:div [:div [:ul (map (fn [r]
                              #[:li (title-case (:label r))
                                [render-quantity (:quantity r)]])
                            (:items recipe))
                   [render-missing (:missing summary)]]
             [:div [render-macros summary]
              [render-pie summary]]]]]))

(defn- render-macros [summary]
  (let [row (fn [label macro indent]
              (let [q (?. summary :macros macro)]
                (if (pos? (?. q :amount))
                  #[:tr
                    [:th (if indent [:span label] label)]
                    [:td (quantity-string q)]])))]
    #[:table [:tbody
              [row "Calorie" (:Calorie Macro) false]
              [row "Fat" (:Fat Macro) false]
              [row "Saturated Fat" (:SaturatedFat Macro) true]
              [row "Carb" (:Carb Macro) false]
              [row "Fiber" (:Fiber Macro) true]
              [row "Sugar" (:Sugar Macro) true]
              [row "Protein" (:Protein Macro) false]
              [row "Salt" (:Salt Macro) false]
              [row "Potassium" (:Potassium Macro) false]]]))

(defn- auth-status [ctx]
  (if-let [email (?. ctx :auth :user :email)]
    #[:p "Welcome " [:strong email]]
    #[:p "Sign in for the best experience."]))

(defn- home [ctx]
  #[:<>
    [site-header ctx "Home"]
    [auth-status ctx]
    [:a {:href "#/about"} "About"]
    [:a {:href (today-path)} "Today"]])

(defn- about [ctx]
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

(defn- make-handler [component ctx]
  (let [root (.getElementById document "root")]
    #(.replaceChildren root #[component ctx %])))

(defn@ main [fs]
  (let [db (DB. fs "../data/")
        auth @(.new Auth {:apiKey __FIREBASE_API_KEY__})
        router (Router.)
        ctx {:db db :auth auth :router router}]
    (.on router "#/" (make-handler home ctx))
    (.on router "#/about" (make-handler about ctx))
    (.on router "#/date/:year/:month/:date" (make-handler render-date ctx))
    (.mount router)))
