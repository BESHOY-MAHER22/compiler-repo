using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace JASON_Compiler
{
    public partial class Form2 : Form
    {
        public Form2()
        {
            InitializeComponent();
            this.button1.Click += new System.EventHandler(this.button1_Click);
        }

        private void button1_Click(object sender, EventArgs e)
        {
            // Clear previous outputs
            dataGridView1.Rows.Clear();
            dataGridView2.Rows.Clear();
            listBox1.Items.Clear();

            string code = textBox1.Text;
            JASON_Compiler.Start_Compiling(code);

            // Populate Tokens Table
            for (int i = 0; i < JASON_Compiler.Jason_Scanner.Tokens.Count; i++)
            {
                var tok = JASON_Compiler.Jason_Scanner.Tokens[i];
                dataGridView1.Rows.Add(tok.lex, tok.token_type.ToString());

                // Populate Symbol Table for Identifiers
                if (tok.token_type == Token_Class.Idenifier)
                {
                    bool alreadyExists = false;
                    foreach (DataGridViewRow row in dataGridView2.Rows)
                    {
                        if (row.Cells[0].Value != null && row.Cells[0].Value.ToString() == tok.lex)
                        {
                            alreadyExists = true;
                            break;
                        }
                    }
                    if (!alreadyExists)
                    {
                        dataGridView2.Rows.Add(tok.lex, "Identifier");
                    }
                }
            }

            // Populate Error List
            for (int i = 0; i < Errors.Error_List.Count; i++)
            {
                listBox1.Items.Add(Errors.Error_List[i]);
            }
        }

        private void dataGridView2_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {

        }
    }
}
