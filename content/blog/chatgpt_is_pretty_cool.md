---
title: chatgpt is pretty cool
date: 2023-06-01
lastmod: 2023-08-06
mermaid: true
readingtime: true
toc: true
tags:
  - chatgpt
  - llm
  - software
  - sql
  - prometheus
---

## overview

ChatGPT is pretty cool. I've gotten to use it in a few scenarios, some good, some bad, and this describes my general experience.

My day job is a software engineer. I might try to ask ChatGPT for other things in the future, but this is solely focused on how I used it for software-related topics.

## the good

✅✅✅

I had a few tables in PostgreSQL that I would constantly need to run DB migrations on to add and update rows. I wanted to create a script that I could run in a transaction and get diagnostic reports throughout. I had seen `RAISE NOTICE` being used before, so I thought I'd try it. Previously I was doing `SELECT 'my debug statement';`, but the output was difficult to read because each of my debug statements had their own `(1 row)` returned, so it was easy to attribute to the wrong statement.

Unfortunately, trial and error did not work out for me. Apparently, `RAISE NOTICE` only works in PL/SQL (Procedural Language extensions to the Structured Query Language), and there are multiple different flavors of PL/SQL depending on what engine you're using. I used Google Search to find the [documentation](https://www.postgresql.org/docs/current/plpgsql-errors-and-messages.html) and Stack Overflow posts about people's experiences using `RAISE NOTICE` before I caved and asked a coworker how they used it. The examples weren't that similar, and I couldn't get my example to work because I kept getting errors about "no variable to write output into". This was maybe 2 hours of me spiraling.

Enter ChatGPT (3.5)!

> **ASIDE**\
> I made the mistake of writing a prompt that was too generic (forgot the `in postgresql` part) the first time, but it's nice you can continue to finetune it.

{{<chat recipient="GPT-3.5" permalink="https://chat.openai.com/">}}
%right%
write plsql in postgresql to raise a notice about how many rows and which rows were updated

%left%
In PostgreSQL, you can use the `GET DIAGNOSTICS` statement along with the `ROW_COUNT` and `FOUND` variables to determine the number of rows updated, and the `RETURNING` clause to retrieve the updated rows' information. Here's an example of PL/pgSQL code to achieve this:

```plpgsql
DO $$
DECLARE
  updated_rows INTEGER;
  updated_data TEXT;
BEGIN
  UPDATE your_table
  SET column1 = 'new_value'
  WHERE condition
  RETURNING column1 || ', ' || column2 INTO updated_data;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  RAISE NOTICE 'Updated % row(s).', updated_rows;

  IF updated_rows > 0 THEN
    RAISE NOTICE 'Updated rows: %', updated_data;
  END IF;
END;
$$;
```

Make sure to replace `your_table` with the actual name of your table, `column1 = 'new_value'` with the desired update condition, and condition with the specific condition that determines which rows to update. Adjust `column1` and `column2` in the `RETURNING` clause to match the columns you want to display.

When executed, this PL/pgSQL block will update the specified rows, raise a notice indicating the number of rows updated, and if there were any updated rows, it will also raise a notice displaying the updated rows' information.

Remember to execute the code within a PL/pgSQL environment or a PostgreSQL client tool that supports executing PL/pgSQL code to see the raised notices.

%right%
allow the update to return multiple rows into the variable

%left%
To allow the update to return multiple rows into a variable in PostgreSQL, you can use an array variable along with the `RETURNING` clause. Here's an example of PL/pgSQL code to achieve this:

```plpgsql
DO $$
DECLARE
  updated_rows INTEGER;
  updated_data TEXT[];
BEGIN
  WITH updated_rows AS (
    UPDATE your_table
    SET column1 = 'new_value'
    WHERE condition
    RETURNING column1 || ', ' || column2
  )
  SELECT array_agg(updated_rows) INTO updated_data FROM updated_rows;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  RAISE NOTICE 'Updated % row(s).', updated_rows;

  IF updated_rows > 0 THEN
    RAISE NOTICE 'Updated rows: %', updated_data;
  END IF;
END;
$$;
```

In the above code, the `updated_data` variable is defined as an array of type `TEXT[]`. The `RETURNING` clause retrieves the desired columns' values and aggregates them into the `updated_data` array using the `array_agg` function. The `updated_rows` variable holds the number of rows updated, obtained through the `GET DIAGNOSTICS` statement.

Replace `your_table` with the actual name of your table, `column1 = 'new_value'` with the desired update condition, and condition with the specific condition that determines which rows to update. Adjust `column1` and `column2` in the `RETURNING` clause to match the columns you want to include in the array.

When executed, this PL/pgSQL block will update the specified rows, raise a notice indicating the number of rows updated, and if there were any updated rows, it will also raise a notice displaying the updated rows' information.

Ensure that you execute the code within a PL/pgSQL environment or a PostgreSQL client tool that supports executing PL/pgSQL code to see the raised notices.
{{</chat>}}

This code snippet ended up working for me straight out of the box after I replaced all the variables and tables with my data, and I learned how to use PL/pgSQL a little bit more.

## the bad

❌❌❌

I started writing Prometheus queries and wasn't familiar with the syntax. The general concept of vectors made sense to me, but I was having a hard time wrapping my head around the one-to-many matchings for the binary operators. Specifically, I wanted to combine two instant vectors where one vector had 1 more label than the other, but I wanted to join on other labels and keep the additional label at the end. This sent me down a rabbit hole of trying to modify the vector labels.

{{<chat recipient="GPT-3.5" permalink="https://chat.openai.com/">}}
%right%
filter out labels from a prometheus timeseries

%left%
To filter out specific labels from a Prometheus time series, you can use the `drop` function in PromQL. The `drop` function allows you to exclude certain labels from the resulting time series.

Here's the syntax to drop labels from a Prometheus time series:

```promql
drop({label_name_1="value1", label_name_2="value2", ...}, label_to_drop1, label_to_drop2, ...)
```

In the above syntax, `label_name_1`, `label_name_2`, etc., represent the labels along with their corresponding values that you want to keep in the resulting time series. `label_to_drop1`, `label_to_drop2`, etc., represent the labels you want to remove from the time series.

For example, if you have a time series with labels `A`, `B`, `C`, and you want to exclude the `C` label, the query would look like:

```promql
drop(metric_name{label_name_1="value1", label_name_2="value2", ...}, "C")
```

Replace `metric_name` with the actual name of the metric, and `label_name_1="value1", label_name_2="value2", ...` with the labels and their respective values that you want to keep in the time series.

By applying the `drop` function with the desired labels, you can filter out specific labels from the Prometheus time series and obtain the desired result.
{{</chat>}}

⛔️ um what? This `drop` function doesn't exist anywhere within Prometheus's documentation on [functions](https://prometheus.io/docs/prometheus/latest/querying/functions/).

{{<chat recipient="GPT-3.5" permalink="https://chat.openai.com/">}}
%right%
is there a function that's the opposite of drop

%left%
Yes, there is a function in PromQL that is the opposite of `drop`. It's called `keep` and allows you to retain specific labels while removing all other labels from a Prometheus time series.

Here's the syntax to use the `keep` function:

```promql
keep({label_name_1="value1", label_name_2="value2", ...}, label_to_keep1, label_to_keep2, ...)
```

In the above syntax, `label_name_1`, `label_name_2`, etc., represent the labels along with their corresponding values that you want to keep in the resulting time series. `label_to_keep1`, `label_to_keep2`, etc., represent the labels you want to retain in the time series.

For example, if you have a time series with labels `A`, `B`, `C`, and you want to keep only the `A` and `B` labels, the query would look like:

```promql
keep(metric_name{label_name_1="value1", label_name_2="value2", ...}, "A", "B")
```

Replace `metric_name` with the actual name of the metric, and `label_name_1="value1", label_name_2="value2", ...` with the labels and their respective values that you want to keep in the time series.

By applying the `keep` function with the desired labels, you can retain specific labels in the Prometheus time series while removing all other labels.
{{</chat>}}

And ChatGPT just kept going into fantasy land. These two functions both don't exist, but I did double check with the official Prometheus documentation to find out that `drop` and `keep` both don't exist anywhere.

Anyways, I solved the problem by reading more about joins in Prometheus, and ended up with the following solution:

{{<code language="promql" connotation="good" title="Group by label only on one side">}}
sum by (C) (
    sum by (A, B) (series1)
  + on (A, B) group_right ()
    max by (A, B, C) (series2 * 0))
)
{{</code>}}

## conclusion

For my day-to-day as a software engineer, ChatGPT is a great rubber duck. 🦆 But as with everything, (1) don't run unvetted code in production (I ran everything in a local environment for isolation) and (2) stay on your toes and double check all results.

I'm excited to use it for initial research for new projects!
