import { FormEvent } from "react";
import { saveGame } from "./actions";

export let metadata = {
  title: "Dino Battles",
  description: "Dino battles",
};

const initialState = {
  message: ""
};

export default async function Page() {
  const createGame = async (formData: FormData) => {
    "use server";

    const dinoId1 = formData.get("dino1Id") as string | null;
    const dinoId2 = formData.get("dino2Id") as string | null;

    await saveGame(dinoId1, dinoId2)
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-lg sm:text-2xl font-bold mb-2">
          Dino Battles
        </h1>
        <h2 className="text-md sm:text-xl mx-4">
          Create a new dino battle
        </h2>
        <div>
          <form className="flex flex-col flex-wrap items-center justify-around max-w-4xl my-8 sm:w-full" action={createGame}>
            <div className="my-8">
              <p className="">Dino 1 Id:</p>
              <input className="p-2 border border-gray-600" type="number" name="dino1Id" defaultValue="6600"/>
            </div>
            <div className="my-8">
              <p className="">Dino 2 Id:</p>
              <input className="p-2 border border-gray-600" type="number" name="dino2Id" defaultValue="763"/>
            </div>
            <button className="font-bold p-4 bg-white rounded-md shadow-xl h-full border border-gray-100" type="submit">
              Create Game
            </button>
          </form>
          {/* <p aria-live="polite" className="sr-only" role="status">
            {state?.message}
          </p> */}
          
        </div>
        <div style={{overflow: "scroll"}}>

        
        <div style={{
width: 750, height: 400, minWidth: 500
        }}>
        <div style={{
                justifyContent: 'flex-start',
                alignItems: 'center',
                display: 'flex',
                flexWrap: 'wrap',
                width: '100%',
                height: '100%',
                backgroundColor: 'f4f4f4',
                padding: 40,
                lineHeight: 1.2,
                fontSize: 24,
                border: "2px solid black"
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: "100%",
                    justifyContent: "space-between"
                }}>
                    <div style={{
                      borderLeft: "2px solid black",
                      borderBottom: "2px solid black",
                      display: 'flex',
                      flexDirection: "row",
                      height: "50%",
                      padding: "20px 20px"
                    }}>

                      <p style={{height: "20px", lineHeight: "20px", marginRight: "16px"}}>HP: </p>
                      <div style={{
                          height: "20px",
                          width: "180px",
                          background: "rgba(8,102,220,.2)",
                          boxShadow: "2px 14px 15px -7px rgba(30, 166, 250, 0.36)",
                          borderRadius: "50px"}}
                          >
                        <div style={{width: "80%", height: "20px", background: "#0866dc", borderBottomLeftRadius: "50px", borderTopLeftRadius: "50px"}}></div>
                      </div>
                    </div>
                    <img src="https://tinydinos.org/transparent/6600.png" width="160" height="160" style={{  transform: "scaleX(-1)"}}/>
                </div>
                <div style={{position: "absolute", display: "flex", justifyContent: "center", width: "100%"}}>

                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: "100%",
                    justifyContent: "space-between",
                    boxSizing: "border-box",
                }}>
                    <img src="https://tinydinos.org/transparent/763.png" width="160" height="160"/>
                    <div style={{
                      borderRight: "2px solid black",
                      borderTop: "2px solid black",
                      display: 'flex',
                      flexDirection: "row",
                      height: "62px",
                      padding: "20px",
                      marginTop: "100px"
                    }}>

                      <p style={{height: "20px", lineHeight: "20px", marginRight: "16px"}}>HP: </p>
                      <div style={{
                          height: "20px",
                          width: "180px",
                          background: "rgba(8,102,220,.2)",
                          boxShadow: "2px 14px 15px -7px rgba(30, 166, 250, 0.36)",
                          borderRadius: "50px"}}
                          >
                        <div style={{width: "80%", height: "20px", background: "#0866dc", borderBottomLeftRadius: "50px", borderTopLeftRadius: "50px"}}></div>
                      </div>
                    </div>
                </div>
            </div>
            </div>
            </div>
      </main>
    </div>
  );
}
