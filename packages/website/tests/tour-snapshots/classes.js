class Animal{}
class Dinosaur extends Animal{}
const TRex=class extends Dinosaur{}

const pet=new TRex()

prn("instanceof TRex =",pet instanceof TRex)
prn("isa? Dinosaur =",pet instanceof Dinosaur)
class Stego extends Animal{#name
constructor(name){super()
this.#name=name
return
}async greet(){return prn(this.#name,"says hello.")
}}
await new Stego("Barney").greet()
