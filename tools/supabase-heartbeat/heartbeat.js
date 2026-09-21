import { createClient } from "@supabase/supabase-js";
import "dotenv/config";


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);


async function heartbeat() {

  try {

    const { error } =
      await supabase
        .from("employees")
        .select("employee_id")
        .limit(1);


    if (error) {
      throw error;
    }


    console.log(
      "Supabase heartbeat successful:",
      new Date().toISOString()
    );


    process.exit(0);


  } catch(error) {

    console.error(
      "Supabase heartbeat failed:",
      error.message
    );


    process.exit(1);

  }

}


heartbeat();